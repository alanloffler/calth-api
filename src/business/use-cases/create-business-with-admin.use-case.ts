import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { Business } from "@business/entities/business.entity";
import { BusinessService } from "@business/business.service";
import { CreateBusinessFullDto } from "@business/dto/create-business-full.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class CreateBusinessWithAdminUseCase {
  constructor(
    private readonly dataSource: DataSource,
    private readonly businessService: BusinessService,
    private readonly usersService: UsersService,
  ) {}

  async execute(dto: CreateBusinessFullDto): Promise<ApiResponse<Business>> {
    const availableTaxId = await this.businessService.checkTaxIdAvailability(dto.business.taxId);
    if (!availableTaxId)
      throw new HttpException("CUIT no disponible, debes elegir un CUIT diferente", HttpStatus.BAD_REQUEST);

    const availableSlug = await this.businessService.checkSlugAvailability(dto.business.slug);
    if (!availableSlug)
      throw new HttpException("Subdominio no disponible, debes elegir un subdominio diferente", HttpStatus.BAD_REQUEST);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const business = queryRunner.manager.create(Business, {
        ...dto.business,
        ...dto.contact,
      });
      const savedBusiness = await queryRunner.manager.save(business);

      await this.usersService.createAdmin(dto.admin, savedBusiness.id, queryRunner.manager);

      await queryRunner.commitTransaction();

      return ApiResponse.created<Business>("Negocio creado", savedBusiness);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
