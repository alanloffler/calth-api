import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ApiResponse } from "@common/helpers/api-response.helper";
import { Business } from "@business/entities/business.entity";
import { CreateBusinessDto } from "@business/dto/create-business.dto";
import { UpdateBusinessDto } from "@business/dto/update-business.dto";
import { User } from "@users/entities/user.entity";

@Injectable()
export class BusinessService {
  constructor(@InjectRepository(Business) private readonly businessRepository: Repository<Business>) {}

  async create(createBusinessDto: CreateBusinessDto): Promise<ApiResponse<Business>> {
    const business = this.businessRepository.create(createBusinessDto);
    const saveBusiness = await this.businessRepository.save(business);
    if (!saveBusiness) throw new HttpException("Error al crear negocio", HttpStatus.BAD_REQUEST);
    console.log(saveBusiness);

    return ApiResponse.created<Business>("Negocio creado", saveBusiness);
  }

  findAll() {
    return `This action returns all business`;
  }

  async findOne(businessId: string): Promise<ApiResponse<Business>> {
    const business = await this.businessRepository.findOne({ where: { id: businessId } });
    if (!business) throw new HttpException("Negocio no encontrado!", HttpStatus.NOT_FOUND);

    business.users = await this.businessRepository.manager
      .createQueryBuilder(User, "user")
      .innerJoin("user.role", "role")
      .where("user.businessId = :businessId", { businessId })
      .andWhere("role.value = :type", { type: "patient" })
      .orderBy("user.createdAt", "DESC")
      .limit(5)
      .getMany();

    return ApiResponse.success<Business>("Negocio encontrado", business);
  }

  async update(businessId: string, updateBusinessDto: UpdateBusinessDto) {
    if (updateBusinessDto.taxId) {
      const availableTaxId = await this.checkTaxIdAvailability(updateBusinessDto.taxId, businessId);
      if (!availableTaxId)
        throw new HttpException("CUIT no disponible, debes elegir un CUIT diferente", HttpStatus.BAD_REQUEST);
    }

    if (updateBusinessDto.slug) {
      const availableSlug = await this.checkSlugAvailability(updateBusinessDto.slug, businessId);
      if (!availableSlug)
        throw new HttpException(
          "Subdominio no disponible, debes elegir un subdominio diferente",
          HttpStatus.BAD_REQUEST,
        );
    }

    const business = await this.businessRepository.update(businessId, updateBusinessDto);
    if (!business) throw new HttpException("Error al actualizar negocio", HttpStatus.NOT_FOUND);
    // TODO: if taxId or slug changed, then invalidate session (refreshToken)
    // TODO: if slug changed, then notify admin by email (maybe all business changes must by notified)

    const updatedBusiness = await this.businessRepository.findOneBy({ id: businessId });
    if (!updatedBusiness) throw new HttpException("Negocio no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Business>("Negocio actualizado", updatedBusiness);
  }

  remove(id: string) {
    return `This action removes a #${id} business`;
  }

  // Without controller, for local strategy use
  public async findBySlug(slug: string): Promise<Business | null> {
    return await this.businessRepository.findOne({ where: { slug }, select: ["id", "slug", "tradeName"] });
  }

  // Will be used as public on business creation
  public async checkTaxIdAvailability(taxId: string, excludeId?: string): Promise<boolean> {
    const query = this.businessRepository.createQueryBuilder("business").where("business.taxId = :taxId", { taxId });

    if (excludeId) query.andWhere("business.id != :excludeId", { excludeId });

    const business = await query.getOne();

    return !business;
  }

  // Will be used as public on business creation
  public async checkSlugAvailability(slug: string, excludeId?: string): Promise<boolean> {
    const query = this.businessRepository.createQueryBuilder("business").where("business.slug = :slug", { slug });

    if (excludeId) query.andWhere("business.id != :excludeId", { excludeId });

    const business = await query.getOne();

    return !business;
  }
}
