import { DataSource } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { Business } from "@business/entities/business.entity";
import { BusinessService } from "@business/business.service";
import { CreateBusinessFullDto } from "@business/dto/create-business-full.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class CreateBusinessWithAdminUseCase {
  constructor(
    private readonly businessService: BusinessService,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
  ) {}

  async execute(dto: CreateBusinessFullDto): Promise<ApiResponse<Business>> {
    const { data: availableTaxId } = await this.businessService.checkTaxIdAvailability(dto.business.taxId);
    if (!availableTaxId)
      throw new HttpException("CUIT no disponible, debes elegir un CUIT diferente", HttpStatus.BAD_REQUEST);

    const { data: availableSlug } = await this.businessService.checkSlugAvailability(dto.business.slug);
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

      this.eventEmitter.emit("business.created", {
        email: savedBusiness.email,
        companyName: savedBusiness.companyName,
      });

      return ApiResponse.created<Business>("Negocio creado", savedBusiness);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
