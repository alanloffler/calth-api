import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreatePermissionDto } from "@permissions/dto/create-permission.dto";
import { Permission } from "@permissions/entities/permission.entity";
import { UpdatePermissionDto } from "@permissions/dto/update-permission.dto";

export interface GroupedPermission {
  id: string;
  name: string;
  module: string;
  actions: {
    id: string;
    name: string;
    key: string;
    value: boolean;
  }[];
}

@Injectable()
export class PermissionsService {
  constructor(@InjectRepository(Permission) private readonly permissionRepository: Repository<Permission>) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<ApiResponse<Permission>> {
    const checkExists = await this.permissionRepository.findOne({
      where: { actionKey: createPermissionDto.actionKey },
    });
    if (checkExists) throw new HttpException("Permiso ya registrado", HttpStatus.BAD_REQUEST);

    const permission = this.permissionRepository.create(createPermissionDto);
    const savePermission = await this.permissionRepository.save(permission);

    if (!savePermission) throw new HttpException("Error al crear permiso", HttpStatus.BAD_REQUEST);

    return ApiResponse.created<Permission>("Permiso creado", savePermission);
  }

  async findAll(): Promise<ApiResponse<Permission[]>> {
    const permissions = await this.permissionRepository.find({ withDeleted: true });
    if (!permissions) throw new HttpException("Permisos no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Permission[]>("Permisos encontrados", permissions);
  }

  async findAllGrouped(): Promise<ApiResponse<GroupedPermission[]>> {
    const permissions = await this.permissionRepository.find({ withDeleted: true });
    if (!permissions) throw new HttpException("Permisos no encontrados", HttpStatus.NOT_FOUND);

    const grouped = permissions.reduce(
      (acc, permission) => {
        if (!acc[permission.category]) {
          acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    const data = Object.entries(grouped).map(([category, perms]) => ({
      id: crypto.randomUUID(),
      name: this.getCategoryName(category),
      module: category,
      actions: perms
        .map((p) => ({
          id: p.id,
          name: p.name,
          key: p.actionKey,
          value: false,
          deletedAt: p.deletedAt,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));

    return ApiResponse.success<GroupedPermission[]>("Permisos encontrados", data);
  }

  async findAllByCategory(category: string): Promise<ApiResponse<Permission[]>> {
    const permissions = await this.permissionRepository.find({ where: { category } });
    if (!permissions) throw new HttpException("Permisos no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Permission[]>("Permisos encontrados", permissions);
  }

  private getCategoryName(category: string): string {
    const categoryNames: Record<string, string> = {
      admin: "Administradores",
      business: "Negocio",
      calendar: "Agenda",
      events: "Turnos",
      medical_history: "Historias médicas",
      patient: "Pacientes",
      permissions: "Permisos",
      professional: "Profesionales",
      roles: "Roles",
      settings: "Configuraciones",
    };

    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  async findOne(id: string): Promise<ApiResponse<Permission>> {
    const permission = await this.permissionRepository.findOne({ where: { id }, withDeleted: true });
    if (!permission) throw new HttpException("Permiso no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Permission>("Permiso encontrado", permission);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionDto): Promise<ApiResponse<Permission>> {
    const result = await this.permissionRepository.update(id, updatePermissionDto);

    if (!result) throw new HttpException("Error al actualizar permiso", HttpStatus.BAD_REQUEST);

    const updatedPermission = await this.permissionRepository.findOneBy({ id });
    if (!updatedPermission) throw new HttpException("Permiso no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Permission>("Permiso actualizado", updatedPermission);
  }

  async softRemove(id: string): Promise<ApiResponse<Permission>> {
    const permissionToRemove = await this.findOneById(id);

    const result = await this.permissionRepository.softRemove(permissionToRemove);
    if (!result) throw new HttpException("Error al eliminar permiso", HttpStatus.BAD_REQUEST);

    return ApiResponse.removed<Permission>("Permiso eliminado", result);
  }

  async remove(id: string): Promise<ApiResponse<Permission>> {
    const permissionToRemove = await this.findOneById(id);

    const result = await this.permissionRepository.remove(permissionToRemove);
    if (!result) throw new HttpException("Error al eliminar permiso", HttpStatus.BAD_REQUEST);

    return ApiResponse.removed<Permission>("Permiso eliminado", result);
  }

  async restore(id: string): Promise<ApiResponse<Permission>> {
    const permissionToRestore = await this.permissionRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!permissionToRestore) throw new HttpException("Permiso no encontrado", HttpStatus.NOT_FOUND);

    const result = await this.permissionRepository.restore(permissionToRestore.id);
    if (!result) throw new HttpException("Error al restaurar permiso", HttpStatus.BAD_REQUEST);

    const restoredAdmin = await this.permissionRepository.findOne({
      where: { id },
    });
    if (!restoredAdmin) throw new HttpException("Permiso no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Permission>("Permiso restaurado", restoredAdmin);
  }

  private async findOneById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({ where: { id } });
    if (!permission) throw new HttpException("Permiso no encontrado", HttpStatus.NOT_FOUND);

    return permission;
  }
}
