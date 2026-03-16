import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThan, MoreThan, Not, Repository } from "typeorm";

import type { IPaginationResponse } from "@events/interfaces/pagination-response.interface";
import { ApiResponse } from "@common/helpers/api-response.helper";
import { BusinessService } from "@business/business.service";
import { CreateEventDto } from "@events/dto/create-event.dto";
import { EEventStatus } from "@common/enums/event-status.enum";
import {
  EVENT_PROF_PROFILE_SELECT,
  EVENT_PROF_SELECT,
  EVENT_ROLE_SELECT,
  EVENT_USER_SELECT,
} from "@events/constants/event-select.constant";
import { Event } from "@events/entities/event.entity";
import { UpdateEventDto } from "@events/dto/update-event.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class EventsService {
  readonly TIME_ZONE = "-03";

  constructor(
    @InjectRepository(Event) private readonly eventRepository: Repository<Event>,
    private readonly businessService: BusinessService,
    private readonly usersService: UsersService,
  ) {}

  async create(createEventDto: CreateEventDto, businessId: string): Promise<ApiResponse<Event>> {
    await this.checkBusiness(businessId);
    await this.checkProfessional(createEventDto.professionalId, businessId);
    await this.checkPatient(createEventDto.userId, businessId);

    const fullDto = { ...createEventDto, businessId };
    const newEvent = this.eventRepository.create(fullDto);

    try {
      const saveEvent = await this.eventRepository.save(newEvent);
      return ApiResponse.created<Event>("Turno creado", saveEvent);
    } catch (error: any) {
      if (error?.driverError?.code === "23505") {
        throw new HttpException("El horario ya fue tomado por otro usuario", HttpStatus.CONFLICT);
      }

      throw new HttpException("Error al crear el turno", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findDaysWithEvents(
    businessId: string,
    professionalId: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<ApiResponse<Record<number, boolean>>> {
    if (!fromDate || !toDate) {
      throw new HttpException("Fecha de inicio y fin son requeridas", HttpStatus.BAD_REQUEST);
    }

    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .andWhere("event.start_date >= :fromDate", { fromDate: `${fromDate} 00:00:00${this.TIME_ZONE}` })
      .andWhere("event.start_date <= :toDate", { toDate: `${toDate} 23:59:59${this.TIME_ZONE}` })
      .select(["event.startDate"])
      .getMany();

    const offsetMs = parseInt(this.TIME_ZONE, 10) * 60 * 60 * 1000;
    const daysWithEvents = new Set(events.map((event) => new Date(event.startDate.getTime() + offsetMs).getDate()));

    const result: Record<number, boolean> = {};
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T00:00:00`);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      result[d.getDate()] = daysWithEvents.has(d.getDate());
    }

    return ApiResponse.success<Record<number, boolean>>("Días ocupados", result);
  }

  async findAllByBusiness(businessId: string, limit: string): Promise<ApiResponse<Event[]>> {
    const queryLimit = limit ? parseInt(limit) : 10;

    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .leftJoin("event.professional", "professional")
      .leftJoin("professional.professionalProfile", "professionalProfile")
      .select(["event", ...EVENT_USER_SELECT, ...EVENT_ROLE_SELECT, ...EVENT_PROF_SELECT, ...EVENT_PROF_PROFILE_SELECT])
      .orderBy("event.start_date::date", "DESC")
      .addOrderBy("event.start_date::time", "ASC")
      .limit(queryLimit)
      .getMany();

    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Event[]>("Turnos encontrados", events);
  }

  async findEventsFiltered(
    businessId: string,
    limit: string,
    date?: string,
    page?: string,
    patientId?: string,
    professionalId?: string,
    status?: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<IPaginationResponse<Event>>> {
    const sortByValue = sortBy ? sortBy : "start_date";
    const sortOrderValue = sortOrder === "asc" ? "ASC" : "DESC";

    let queryLimit = limit ? parseInt(limit, 10) : 10;
    if (!queryLimit || queryLimit <= 0) queryLimit = 10;

    const pageNum = page ? parseInt(page, 10) : 1;
    const currentPage = pageNum > 0 ? pageNum : 1;
    const offset = (currentPage - 1) * queryLimit;

    const baseQb = this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .leftJoin("event.professional", "professional")
      .leftJoin("professional.professionalProfile", "professionalProfile")
      .select([
        "event",
        ...EVENT_USER_SELECT,
        ...EVENT_ROLE_SELECT,
        ...EVENT_PROF_SELECT,
        ...EVENT_PROF_PROFILE_SELECT,
      ]);

    if (date) {
      baseQb.andWhere("event.startDate >= :startOfDay AND event.startDate <= :endOfDay", {
        startOfDay: `${date} 00:00:00${this.TIME_ZONE}`,
        endOfDay: `${date} 23:59:59${this.TIME_ZONE}`,
      });
    }
    if (patientId) {
      baseQb.andWhere("user.id = :patientId", { patientId });
    }
    if (professionalId) {
      baseQb.andWhere("professional.id = :professionalId", { professionalId });
    }
    if (status) {
      baseQb.andWhere("event.status = :status", { status });
    }

    let sortKey: string;

    switch (sortBy) {
      case "startDate":
        sortKey = "start_date";
        break;
      case "user_firstName":
        sortKey = "user.first_name";
        break;
      case "professional_firstName":
        sortKey = "professional.first_name";
        break;
      default:
        sortKey = "start_date";
    }

    if (sortBy && sortOrder && sortBy !== "startDate") {
      if (sortKey.includes("user") || sortKey.includes("professional")) {
        baseQb.orderBy(`${sortKey}`, sortOrderValue);
      } else {
        baseQb.orderBy(`event.${sortBy}`, sortOrderValue);
      }
    } else {
      const dateOrder = sortBy === "startDate" ? sortOrderValue : "DESC";
      baseQb.orderBy("event.start_date::date", dateOrder).addOrderBy("event.start_date::time", "ASC");
    }

    const events = await baseQb.clone().limit(queryLimit).offset(offset).getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    const total = await baseQb.getCount();
    if (total === null || total === undefined)
      throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    const response: IPaginationResponse<Event> = {
      result: events,
      total: total,
    };

    return ApiResponse.success<IPaginationResponse<Event>>("Turnos encontrados", response);
  }

  private toLocalDateString(utcDate: Date): string {
    const offset = parseInt(this.TIME_ZONE, 10) * 60 * 60 * 1000;
    const localTime = new Date(utcDate.getTime() + offset);
    const year = localTime.getUTCFullYear();
    const month = String(localTime.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localTime.getUTCDate()).padStart(2, "0");
    const hours = String(localTime.getUTCHours()).padStart(2, "0");
    const minutes = String(localTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(localTime.getUTCSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}${this.TIME_ZONE}`;
  }

  async findAll(
    businessId: string,
    professionalId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<Event[]>> {
    const query = this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .leftJoin("event.professional", "professional")
      .leftJoin("professional.role", "profRole")
      .leftJoin("professional.professionalProfile", "professionalProfile")
      .select([
        "event",
        "profRole.name",
        "profRole.value",
        "professional.firstName",
        "professional.ic",
        "professional.id",
        "professional.lastName",
        "professionalProfile.professionalPrefix",
        "user.email",
        "user.firstName",
        "user.ic",
        "user.id",
        "user.lastName",
        "user.phoneNumber",
        "userRole.name",
        "userRole.value",
      ]);

    if (startDate && endDate) {
      query.andWhere("event.startDate <= :endDate", { endDate: this.toLocalDateString(new Date(endDate)) });
      query.andWhere("event.endDate >= :startDate", { startDate: this.toLocalDateString(new Date(startDate)) });
    } else if (startDate) {
      query.andWhere("event.endDate >= :startDate", { startDate: this.toLocalDateString(new Date(startDate)) });
    } else if (endDate) {
      query.andWhere("event.startDate <= :endDate", { endDate: this.toLocalDateString(new Date(endDate)) });
    }

    const events = await query.getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Event[]>("Turnos encontrados", events);
  }

  async findAllByDate(businessId: string, professionalId: string, date: string): Promise<ApiResponse<Event[]>> {
    // TODO: get timezone from param if business is not from ARGENTINA
    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .andWhere("event.startDate >= :startOfDay AND event.startDate <= :endOfDay", {
        startOfDay: `${date} 00:00:00${this.TIME_ZONE}`,
        endOfDay: `${date} 23:59:59${this.TIME_ZONE}`,
      })
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .leftJoin("event.professional", "professional")
      .leftJoin("professional.role", "profRole")
      .leftJoin("professional.professionalProfile", "professionalProfile")
      .select([
        "event",
        "profRole.name",
        "profRole.value",
        "professional.firstName",
        "professional.ic",
        "professional.id",
        "professional.lastName",
        "professionalProfile.professionalPrefix",
        "user.email",
        "user.firstName",
        "user.ic",
        "user.id",
        "user.lastName",
        "user.phoneNumber",
        "userRole.name",
        "userRole.value",
      ])
      .getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Event[]>("Turnos encontrados", events);
  }

  async findAllByDateArray(businessId: string, professionalId: string, date: string): Promise<ApiResponse<string[]>> {
    // TODO: get timezone from param if business is not from ARGENTINA
    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .andWhere("event.startDate >= :startOfDay AND event.startDate <= :endOfDay", {
        startOfDay: `${date} 00:00:00${this.TIME_ZONE}`,
        endOfDay: `${date} 23:59:59${this.TIME_ZONE}`,
      })
      .select(["event.startDate"])
      .getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    const dates = events
      .map((event) => {
        const utcTime = event.startDate.getTime();
        const localTime = new Date(utcTime + parseInt(this.TIME_ZONE, 10) * 60 * 60 * 1000);
        return localTime.toISOString().substring(11, 16);
      })
      .sort((a, b) => a.localeCompare(b));

    return ApiResponse.success<string[]>(`Turnos encontrados para ${date}`, dates);
  }

  async findByBusinessProfessionalPatient(
    businessId: string,
    patientId: string,
    professionalId?: string,
  ): Promise<ApiResponse<Event[]>> {
    const events = await this.eventRepository
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.user", "u")
      .leftJoinAndSelect("u.role", "ur")
      .leftJoinAndSelect("e.professional", "p")
      .leftJoinAndSelect("p.professionalProfile", "pp")
      .where("e.business_id = :businessId", { businessId })
      .andWhere("e.professional_id = :professionalId", { professionalId })
      .andWhere("e.user_id = :patientId", { patientId })
      .andWhere("e.deleted_at IS NULL")
      .orderBy("e.start_date", "DESC")
      .addOrderBy("e.end_date", "DESC")
      .getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Event[]>("Turnos encontrados", events);
  }

  async findOne(id: string, businessId: string): Promise<ApiResponse<Event>> {
    const event = await this.eventRepository
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.user", "u")
      .leftJoinAndSelect("u.role", "ur")
      .leftJoinAndSelect("e.professional", "p")
      .leftJoinAndSelect("p.professionalProfile", "pp")
      .where("e.business_id = :businessId", { businessId })
      .andWhere("e.id = :id", { id })
      .andWhere("e.deleted_at IS NULL")
      .orderBy("e.start_date", "DESC")
      .addOrderBy("e.end_date", "DESC")
      .getOne();
    if (!event) throw new HttpException("Turno no encontrado", HttpStatus.NOT_FOUND);

    return ApiResponse.success<Event>("Turno encontrado", event);
  }

  async updateStatus(eventId: string, businessId: string, status: EEventStatus): Promise<ApiResponse<boolean>> {
    const event = await this.findOneById(eventId, businessId);
    event.status = status;

    const result = this.eventRepository.save(event);
    if (!result) throw new HttpException("Error al actualizar el estado del turno", HttpStatus.BAD_REQUEST);

    return ApiResponse.success("Estado del turno actualizado", true);
  }

  async update(id: string, updateEventDto: UpdateEventDto, businessId: string): Promise<ApiResponse<Event>> {
    await this.checkBusiness(businessId);
    await this.checkProfessional(updateEventDto?.professionalId, businessId);
    await this.checkPatient(updateEventDto?.userId, businessId);

    const event = await this.findOneById(id, businessId);
    const newStart = updateEventDto.startDate || event.startDate;
    const newEnd = updateEventDto.endDate || event.endDate;
    const newProfessional = updateEventDto.professionalId || event.professionalId;

    const slotAvailable = await this.checkSlotAvailable(
      {
        professionalId: newProfessional,
        startDate: newStart,
        endDate: newEnd,
      },
      businessId,
      event.id,
    );

    if (!slotAvailable) throw new HttpException("El turno se superpone con otro existente", HttpStatus.BAD_REQUEST);

    const result = await this.eventRepository.update(id, updateEventDto);
    if (!result) throw new HttpException("Error al actualizar turno", HttpStatus.BAD_REQUEST);

    const updatedEvent = await this.findOneById(id, businessId);

    return ApiResponse.success<Event>("Turno actualizado", updatedEvent);
  }

  async remove(id: string, businessId: string): Promise<ApiResponse<Event>> {
    const userToRemove = await this.findOneById(id, businessId);

    const result = await this.eventRepository.remove(userToRemove);
    if (!result) throw new HttpException("Error al eliminar turno", HttpStatus.BAD_REQUEST);

    return ApiResponse.removed<Event>("Turno eliminado", result);
  }

  // Private methods
  private async findOneById(id: string, businessId: string): Promise<Event> {
    const event = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.id = :id", { id })
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .leftJoin("event.professional", "professional")
      .leftJoin("professional.role", "profRole")
      .select([
        "event",
        "profRole.name",
        "profRole.value",
        "professional.firstName",
        "professional.ic",
        "professional.id",
        "professional.lastName",
        "user.email",
        "user.firstName",
        "user.ic",
        "user.id",
        "user.lastName",
        "user.phoneNumber",
        "userRole.name",
        "userRole.value",
      ])
      .getOne();
    if (!event) throw new HttpException("Turno no encontrado", HttpStatus.NOT_FOUND);

    return event;
  }

  private async checkBusiness(businessId?: string): Promise<void> {
    if (!businessId) throw new HttpException("Negocio no encontrado al crear el turno", HttpStatus.NOT_FOUND);

    const business = await this.businessService.findOne(businessId);
    if (!business) throw new HttpException("Negocio no encontrado al crear el turno", HttpStatus.NOT_FOUND);
  }

  private async checkProfessional(professionalId?: string, businessId?: string): Promise<void> {
    if (!professionalId || !businessId) return;

    const professional = await this.usersService.findOneById(professionalId, businessId);
    if (!professional) throw new HttpException("Profesional no encontrado al crear el turno", HttpStatus.NOT_FOUND);
  }

  private async checkPatient(userId?: string, businessId?: string): Promise<void> {
    if (!userId || !businessId) return;

    const user = await this.usersService.findOneById(userId, businessId);
    if (!user) throw new HttpException("Paciente no encontrado al crear el turno", HttpStatus.NOT_FOUND);
  }

  private async checkSlotAvailable(
    data: { professionalId: string; startDate: Date; endDate: Date },
    businessId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const overlappingEvent = await this.eventRepository.findOne({
      where: {
        businessId,
        professionalId: data.professionalId,
        startDate: LessThan(data.endDate),
        endDate: MoreThan(data.startDate),
        ...(excludeId && { id: Not(excludeId) }),
      },
    });

    return !overlappingEvent;
  }
}
