import * as bcrypt from "bcrypt";
import { ConfigService } from "@nestjs/config";
import { DataSource, EntityManager, Repository } from "typeorm";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { CreateUserDto } from "@users/dto/create-user.dto";
import { ERole } from "@common/enums/role.enum";
import { MedicalHistory } from "@medical-history/entities/medical-history.entity";
import { Role } from "@roles/entities/role.entity";
import {
  PATIENT_PROFILE_SELECT,
  PROFESSIONAL_PROFILE_SELECT,
  USER_HISTORY_SELECT,
  USER_ROLE_SELECT,
  USER_SELECT,
} from "@users/constants/user-select.constant";
import { UpdateUserDto } from "@users/dto/update-user.dto";
import { User } from "@users/entities/user.entity";
import { PostgresError } from "postgres";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async createProfessional(userDto: CreateUserDto, businessId: string, manager: EntityManager): Promise<User> {
    const existingIc = await manager.findOne(User, { where: { businessId, ic: userDto.ic } });
    if (existingIc) throw new HttpException("DNI ya registrado", HttpStatus.BAD_REQUEST);

    const existingUsername = await manager.findOne(User, { where: { businessId, userName: userDto.userName } });
    if (existingUsername) throw new HttpException("Nombre de usuario ya registrado", HttpStatus.BAD_REQUEST);

    const existingEmail = await manager.findOne(User, { where: { businessId, email: userDto.email } });
    if (existingEmail) throw new HttpException("Email ya registrado", HttpStatus.BAD_REQUEST);

    const saltRounds = parseInt(this.configService.get("BCRYPT_SALT_ROUNDS") || "10");
    const hashedPassword = await bcrypt.hash(userDto.password, saltRounds);

    const professionalRole = await manager.findOne(Role, { where: { value: "professional" } });
    if (!professionalRole) throw new HttpException("Rol de profesional no encontrado", HttpStatus.BAD_REQUEST);

    const user = manager.create(User, {
      ...userDto,
      businessId,
      password: hashedPassword,
      role: professionalRole,
    });

    return manager.save(user);
  }

  async createPatient(userDto: CreateUserDto, businessId: string, manager: EntityManager): Promise<User> {
    const existingIc = await manager.findOne(User, { where: { businessId, ic: userDto.ic } });
    if (existingIc) throw new HttpException("DNI ya registrado", HttpStatus.BAD_REQUEST);

    const existingUsername = await manager.findOne(User, { where: { businessId, userName: userDto.userName } });
    if (existingUsername) throw new HttpException("Nombre de usuario ya registrado", HttpStatus.BAD_REQUEST);

    const existingEmail = await manager.findOne(User, { where: { businessId, email: userDto.email } });
    if (existingEmail) throw new HttpException("Email ya registrado", HttpStatus.BAD_REQUEST);

    const saltRounds = parseInt(this.configService.get("BCRYPT_SALT_ROUNDS") || "10");
    const hashedPassword = await bcrypt.hash(userDto.password, saltRounds);

    const patientRole = await manager.findOne(Role, { where: { value: "patient" } });
    if (!patientRole) throw new HttpException("Rol de paciente no encontrado", HttpStatus.BAD_REQUEST);

    const user = manager.create(User, {
      ...userDto,
      businessId,
      password: hashedPassword,
      role: patientRole,
    });

    return manager.save(user);
  }

  async findLatestPatients(businessId: string, limit: string) {
    const queryLimit = limit ? parseInt(limit) : 10;

    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, "profile.professionalPrefix"])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("role.value = :role", { role: "patient" })
      .orderBy("user.createdAt", "DESC")
      .limit(queryLimit)
      .getMany();

    if (!users) throw new HttpException("Pacientes no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User[]>("Pacientes encontrados", users);
  }

  async findAll(role: string, businessId: string): Promise<ApiResponse<User[]>> {
    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, "profile.professionalPrefix"])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("role.value = :role", { role })
      .orderBy("user.firstName", "ASC")
      .getMany();
    if (!users) throw new HttpException("Usuarios no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User[]>("Usuarios encontrados", users);
  }

  async findAllSoftRemoved(role: string, businessId: string): Promise<ApiResponse<User[]>> {
    const users = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .select([...USER_SELECT, ...USER_ROLE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("role.value = :role", { role })
      .withDeleted()
      .getMany();
    if (!users) throw new HttpException("Usuarios no encontrados", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User[]>("Usuarios encontrados", users);
  }

  async findOne(id: string, businessId: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PROFESSIONAL_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .withDeleted()
      .getOne();
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Usuario encontrado", user);
  }

  async findPatientWithHistory(businessId: string, id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .select([...USER_SELECT, ...USER_ROLE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .getOne();

    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);
    if (user.role?.value !== ERole.PATIENT) {
      throw new HttpException("El usuario no es un paciente", HttpStatus.BAD_REQUEST);
    }

    const medicalHistory = await this.dataSource
      .getRepository(MedicalHistory)
      .createQueryBuilder("history")
      .select([...USER_HISTORY_SELECT])
      .where("history.businessId = :businessId", { businessId })
      .andWhere("history.userId = :userId", { userId: user.id })
      .getMany();

    if (!medicalHistory) throw new HttpException("Historial médico no encontrado", HttpStatus.NOT_FOUND);

    user.medicalHistory = medicalHistory;

    return ApiResponse.success("Paciente encontrado", user);
  }

  async findPatientSoftRemovedWithHistory(businessId: string, id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .select([...USER_SELECT, ...USER_ROLE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .withDeleted()
      .getOne();

    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);
    if (user.role?.value !== ERole.PATIENT) {
      throw new HttpException("El usuario no es un paciente", HttpStatus.BAD_REQUEST);
    }

    const medicalHistory = await this.dataSource
      .getRepository(MedicalHistory)
      .createQueryBuilder("history")
      .select([...USER_HISTORY_SELECT])
      .where("history.businessId = :businessId", { businessId })
      .andWhere("history.userId = :userId", { userId: user.id })
      .withDeleted()
      .orderBy("history.createdAt", "DESC")
      .getMany();

    if (!medicalHistory) throw new HttpException("Historial médico no encontrado", HttpStatus.NOT_FOUND);

    user.medicalHistory = medicalHistory;

    return ApiResponse.success("Paciente encontrado", user);
  }

  async findOneSoftRemoved(id: string, businessId: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PROFESSIONAL_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .withDeleted()
      .getOne();
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Usuario encontrado", user);
  }

  async findOneWithCredentials(id: string, businessId: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository.findOne({
      where: { businessId, id },
    });
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Usuario encontrado", user);
  }

  async findOneWithToken(id: string, businessId: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, "user.refreshToken"])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .getOne();
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Usuario encontrado", user);
  }

  // Find by role
  async findProfessionalWithProfile(id: string, businessId: string): Promise<ApiResponse<User>> {
    const professional = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PROFESSIONAL_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .getOne();
    if (!professional) throw new HttpException("Profesional no encontrado!", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Profesional encontrado", professional);
  }

  async findProfessionalSoftRemovedWithProfile(businessId: string, id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.professionalProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PROFESSIONAL_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .withDeleted()
      .getOne();
    if (!user) throw new HttpException("Profesional no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Profesional encontrado", user);
  }

  // Used on FE Patient view
  async findPatientSoftRemovedWithProfile(businessId: string, id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.patientProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PATIENT_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .withDeleted()
      .getOne();
    if (!user) throw new HttpException("Paciente no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Paciente encontrado", user);
  }

  // Used on FE Patient view !superAdmin
  async findPatientWithProfile(businessId: string, id: string): Promise<ApiResponse<User>> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.patientProfile", "profile")
      .select([...USER_SELECT, ...USER_ROLE_SELECT, ...PATIENT_PROFILE_SELECT])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .getOne();
    if (!user) throw new HttpException("Paciente no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Paciente encontrado", user);
  }

  // TODO: maybe remove after implement updatePatient
  async update(id: string, businessId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { businessId, id },
    });
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    const result = await this.userRepository.update(id, updateUserDto);
    if (!result) throw new HttpException("Error al actualizar el usuario", HttpStatus.BAD_REQUEST);

    const updatedUser = await this.userRepository.findOneBy({ id });
    if (!updatedUser) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<User>("Usuario actualizado", updatedUser);
  }

  async updateUser(
    id: string,
    businessId: string,
    updateUserDto: UpdateUserDto,
    manager: EntityManager,
  ): Promise<void> {
    const user = await manager.findOne(User, { where: { id, businessId } });
    if (!user) throw new HttpException("Profesional no encontrado", HttpStatus.NOT_FOUND);

    if (updateUserDto.ic !== undefined && updateUserDto.ic !== user.ic) {
      const existingIc = await manager.findOne(User, { where: { businessId, ic: updateUserDto.ic } });
      if (existingIc) throw new HttpException("DNI ya registrado", HttpStatus.BAD_REQUEST);
      user.ic = updateUserDto.ic;
    }

    if (updateUserDto.userName !== undefined && updateUserDto.userName !== user.userName) {
      const existingUsername = await manager.findOne(User, { where: { businessId, userName: updateUserDto.userName } });
      if (existingUsername) throw new HttpException("Nombre de usuario ya registrado", HttpStatus.BAD_REQUEST);
      user.userName = updateUserDto.userName;
    }

    if (updateUserDto.email !== undefined && updateUserDto.email !== user.email) {
      const existingEmail = await manager.findOne(User, { where: { businessId, email: updateUserDto.email } });
      if (existingEmail) throw new HttpException("Email ya registrado", HttpStatus.BAD_REQUEST);
      user.email = updateUserDto.email;
    }

    if (updateUserDto.password !== undefined) {
      const saltRounds = parseInt(this.configService.get("BCRYPT_SALT_ROUNDS") || "10");
      const hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);
      user.password = hashedPassword;
    }

    if (updateUserDto.firstName !== undefined) user.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) user.lastName = updateUserDto.lastName;
    if (updateUserDto.phoneNumber !== undefined) user.phoneNumber = updateUserDto.phoneNumber;

    try {
      await manager.save(user);
    } catch {
      throw new HttpException("Error al actualizar el profesional", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async softRemove(id: string, businessId: string, manager: EntityManager): Promise<void> {
    const user = await manager.findOne(User, { where: { id, businessId } });
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.softRemove(user);
    } catch {
      throw new HttpException("Error al eliminar usuario", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async remove(id: string, businessId: string, manager: EntityManager): Promise<void> {
    const user = await manager.findOne(User, { where: { businessId, id } });
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.remove(user);
    } catch (error: unknown) {
      const err = error as any;
      const pgCode = err.code || err.driverError?.code;
      const pgTable = err.table || err.driverError?.table;

      if (pgCode === "23503" && pgTable === "medical_history") {
        throw new HttpException("No podes eliminar un paciente con historias médicas", HttpStatus.CONFLICT);
      }
      throw new HttpException("Error al eliminar usuario", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async restore(id: string, businessId: string, manager: EntityManager): Promise<void> {
    const user = await manager.findOne(User, { where: { businessId, id }, withDeleted: true });
    if (!user) throw new HttpException("Usuario no encontrado", HttpStatus.NOT_FOUND);

    try {
      await manager.restore(User, { id, businessId });
    } catch {
      throw new HttpException("Error al restaurar usuario", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Without controller for external API use
  public async findOneByEmail(email: string, businessId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { businessId, email }, relations: ["role"] });
    if (!user) return null;

    return user;
  }

  // Used in auth.service, there is managed error
  public async getUser(id: string, businessId: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .leftJoin("user.role", "role")
      .leftJoin("role.rolePermissions", "rolePermissions")
      .leftJoin("rolePermissions.permission", "permission")
      .addSelect([
        "role.id",
        "role.name",
        "role.value",
        "rolePermissions.roleId",
        "rolePermissions.permissionId",
        "permission.id",
        "permission.actionKey",
      ])
      .where("user.businessId = :businessId", { businessId })
      .andWhere("user.id = :id", { id })
      .getOne();

    return user;
  }

  public async checkEmailAvailability(email: string, businessId: string): Promise<ApiResponse<boolean>> {
    const user = await this.userRepository.findOne({ where: { businessId, email } });
    return ApiResponse.success<boolean>("Disponibilidad de email", user ? false : true);
  }

  public async checkIcAvailability(ic: string, businessId: string): Promise<ApiResponse<boolean>> {
    const user = await this.userRepository.findOne({ where: { businessId, ic } });
    return ApiResponse.success<boolean>("Disponibilidad de DNI", user ? false : true);
  }

  public async checkUsernameAvailability(userName: string, businessId: string): Promise<ApiResponse<boolean>> {
    const username = await this.userRepository.findOne({ where: { businessId, userName } });
    return ApiResponse.success<boolean>("Disponibilidad de nombre de usuario", username ? false : true);
  }

  public async findOneById(id: string, businessId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { businessId, id } });
    return user;
  }

  public async clearRefreshToken(id: string): Promise<void> {
    await this.userRepository.update(id, { refreshToken: null });
  }
}
