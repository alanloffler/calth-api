import { DataSource, In, IsNull, Not, Repository } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import type { IRequest } from "@auth/interfaces/request.interface";
import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreateRoleDto } from "@roles/dto/create-role.dto";
import { ERole } from "@common/enums/role.enum";
import { Permission } from "@permissions/entities/permission.entity";
import { PermissionsCacheService } from "@permissions/permissions-cache.service";
import { Role } from "@roles/entities/role.entity";
import { RolePermission } from "@roles/entities/role-permission.entity";
import { UpdateRoleDto } from "@roles/dto/update-role.dto";

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Permission) private readonly permRepository: Repository<Permission>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission) private readonly rolePermRepository: Repository<RolePermission>,
    private permissionsCacheService: PermissionsCacheService,
    private readonly dataSource: DataSource,
  ) {}

  async create(createRoleDto: CreateRoleDto): Promise<ApiResponse<Role>> {
    await this.roleExists(createRoleDto.value);

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      value: createRoleDto.value,
      description: createRoleDto.description,
    });

    const enabledPermissionIds = createRoleDto.permissions.flatMap((group) =>
      group.actions.filter((a) => a.value).map((a) => a.id),
    );

    const uniqPermissionIds = Array.from(new Set(enabledPermissionIds));

    if (uniqPermissionIds.length === 0) {
      const savedRole = await this.roleRepository.save(role);
      const result = await this.roleRepository.findOne({
        where: { id: savedRole.id },
        relations: ["rolePermissions", "rolePermissions.permission"],
      });

      return ApiResponse.created<Role>("Rol creado", result || undefined);
    }

    const permissions = await this.permRepository.find({
      where: { id: In(uniqPermissionIds) },
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedRole = await queryRunner.manager.save(Role, role);
      const rolePermsToInsert = permissions.map((perm) => {
        return this.rolePermRepository.create({
          roleId: savedRole.id,
          permissionId: perm.id,
        });
      });

      await queryRunner.manager.save(RolePermission, rolePermsToInsert);
      await queryRunner.commitTransaction();

      const result = await this.roleRepository.findOne({
        where: { id: savedRole.id },
        relations: ["rolePermissions", "rolePermissions.permission"],
      });

      return ApiResponse.created<Role>("Rol creado", result || undefined);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(req: IRequest): Promise<ApiResponse<Role[]>> {
    const roles = await this.roleRepository.find({
      where: req.user.isSuperAdmin ? {} : { value: Not(ERole.SUPERADMIN) },
      order: { name: "ASC" },
    });
    if (!roles) throw new HttpException("Roles no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Role[]>("Roles encontrados", roles);
  }

  async findAllSoftRemoved(req: IRequest): Promise<ApiResponse<Role[]>> {
    const roles = await this.roleRepository.find({
      where: req.user.isSuperAdmin ? {} : { value: Not(ERole.SUPERADMIN) },
      order: { name: "ASC" },
      withDeleted: true,
    });
    if (!roles) throw new HttpException("Roles no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Role[]>("Roles encontrados", roles);
  }

  async findOne(id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ["users", "rolePermissions", "rolePermissions.permission"],
    });
    if (!role) throw new HttpException("Rol no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Role>("Rol encontrado", role);
  }

  async findOneSoftRemoved(id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ["users", "rolePermissions", "rolePermissions.permission"],
      withDeleted: true,
    });
    if (!role) throw new HttpException("Rol no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Role>("Rol encontrado", role);
  }

  async findIdByValue(value: string): Promise<ApiResponse<string>> {
    const role = await this.roleRepository.findOne({
      where: { value },
    });
    if (!role) throw new HttpException("Rol no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<string>("Rol encontrado", role.id);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<ApiResponse<Role>> {
    const roleToUpdate = await this.findRoleById(id);
    const { value, permissions } = updateRoleDto;
    if (value && value !== roleToUpdate.value && (await this.roleAlreadyExists(value))) {
      throw new HttpException("El rol ya existe. No puedes repetirlo", HttpStatus.BAD_REQUEST);
    }

    const enabledPermissionIds = permissions
      ? permissions.flatMap((group) => group.actions.filter((a) => a.value).map((a) => a.id))
      : [];

    const uniquePermissionIds = Array.from(new Set(enabledPermissionIds));

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const updateRole = await queryRunner.manager.save(Role, {
        id: roleToUpdate.id,
        name: updateRoleDto.name,
        value: updateRoleDto.value,
        description: updateRoleDto.description,
      });

      await queryRunner.manager.delete(RolePermission, { roleId: id });

      if (uniquePermissionIds.length > 0) {
        const permissions = await this.permRepository.find({
          where: { id: In(uniquePermissionIds), deletedAt: IsNull() },
        });

        const rolePermsToInsert = permissions.map((perm) => {
          return this.rolePermRepository.create({
            roleId: updateRole.id,
            permissionId: perm.id,
          });
        });

        await queryRunner.manager.save(RolePermission, rolePermsToInsert);
      }

      await queryRunner.commitTransaction();

      const result = await this.roleRepository.findOne({
        where: { id: updateRole.id },
        relations: ["rolePermissions", "rolePermissions.permission"],
      });

      await this.permissionsCacheService.invalidateRolePermissions(id);

      return ApiResponse.success<Role>("Rol actualizado", result || undefined);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(id: string): Promise<ApiResponse<Role>> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ["users"],
    });
    if (role && role.users.length > 0) {
      throw new HttpException(
        `${role.users.length} ${role.users.length > 1 ? "usuarios tienen" : "usuario tiene"} este rol. No puedes eliminar un rol con usuarios`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const roleToRemove = await this.findRoleById(id);

    const result = await this.roleRepository.remove(roleToRemove);
    if (!result) throw new HttpException("Error al eliminar rol", HttpStatus.BAD_REQUEST);

    await this.permissionsCacheService.invalidateRolePermissions(id);

    return ApiResponse.success<Role>("Rol eliminado", result);
  }

  async softRemove(id: string): Promise<ApiResponse<Role>> {
    const roleToRemove = await this.findRoleById(id);

    const result = await this.roleRepository.softRemove(roleToRemove);
    if (!result) throw new HttpException("Error al eliminar rol", HttpStatus.BAD_REQUEST);

    await this.permissionsCacheService.invalidateRolePermissions(id);

    return ApiResponse.removed<Role>("Rol eliminado", result);
  }

  async restore(id: string): Promise<ApiResponse<Role>> {
    const roleToRestore = await this.roleRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!roleToRestore) throw new HttpException("Rol no encontrado", HttpStatus.NOT_FOUND);

    const result = await this.roleRepository.restore(roleToRestore.id);
    if (!result) throw new HttpException("Error al restaurar rol", HttpStatus.BAD_REQUEST);

    const restoredAdmin = await this.findRoleById(id);

    return ApiResponse.success<Role>("Rol restaurado", restoredAdmin);
  }

  private async roleExists(value: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { value } });
    if (role) throw new HttpException("El rol ya existe. No puedes repetirlo", HttpStatus.BAD_REQUEST);
  }

  private async roleAlreadyExists(value: string): Promise<boolean> {
    const role = await this.roleRepository.findOne({ where: { value } });
    return role ? true : false;
  }

  private async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new HttpException("Rol no encontrado", HttpStatus.NOT_FOUND);

    return role;
  }
}
