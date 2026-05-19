import { Brackets, DataSource, LessThan, MoreThan, Not, Repository } from "typeorm";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "crypto";

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
import { IScheduleImpactResponse } from "@events/interfaces/schedule-impact-response.interface";
import { ProfessionalProfile } from "@professional-profile/entities/professional-profile.entity";
import { ProfessionalProfileService } from "@professional-profile/professional-profile.service";
import { ScheduleImpactDto } from "@events/dto/schedule-impact.dto";
import { UpdateEventDto } from "@events/dto/update-event.dto";
import { UsersService } from "@users/users.service";

@Injectable()
export class EventsService {
  readonly TIME_ZONE = "-03";

  constructor(
    @InjectRepository(Event) private readonly eventRepository: Repository<Event>,
    private readonly businessService: BusinessService,
    private readonly eventEmitter: EventEmitter2,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    private readonly professionalProfileService: ProfessionalProfileService,
  ) {}

  async create(createEventDto: CreateEventDto, businessId: string): Promise<ApiResponse<Event | Event[]>> {
    await this.checkBusiness(businessId);
    await this.checkProfessional(createEventDto.professionalId, businessId);
    await this.checkPatient(createEventDto.userId, businessId);

    if (createEventDto.recurringDates?.length) {
      if (!createEventDto.startDate) {
        throw new HttpException("La fecha de inicio es obligatoria para turnos recurrentes", HttpStatus.BAD_REQUEST);
      }
      return this.createRecurring(
        createEventDto as CreateEventDto & { startDate: Date; recurringDates: Date[] },
        businessId,
      );
    }

    if (!createEventDto.startDate) {
      throw new HttpException("La fecha de inicio es obligatoria", HttpStatus.BAD_REQUEST);
    }

    const isAvailable = await this.checkSlotAvailable(
      {
        professionalId: createEventDto.professionalId,
        startDate: createEventDto.startDate,
        endDate: createEventDto.endDate,
      },
      businessId,
    );

    if (!isAvailable) {
      throw new HttpException("El horario ya fue tomado por otro usuario", HttpStatus.CONFLICT);
    }

    const fullDto = { ...createEventDto, businessId };
    const newEvent = this.eventRepository.create(fullDto);

    try {
      // Save event
      const saveEvent = await this.eventRepository.save(newEvent);
      // Get user data and emit event
      // TODO: GET COMPANY NAME FROM BUSINESSID
      const user = await this.usersService.findOneById(createEventDto.userId, businessId);
      if (user) {
        this.eventEmitter.emit("event.created", {
          companyName: saveEvent.businessId,
          email: user.email,
          fullName: `${user.firstName} ${user.lastName}`,
          title: saveEvent.title,
          startDate: saveEvent.startDate.toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }),
        });
      }

      return ApiResponse.created<Event>("Turno creado", saveEvent);
    } catch (error: any) {
      if (error?.driverError?.code === "23505") {
        throw new HttpException("El horario ya fue tomado por otro usuario", HttpStatus.CONFLICT);
      }

      throw new HttpException("Error al crear el turno", HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async createRecurring(
    createEventDto: CreateEventDto & { startDate: Date; recurringDates: Date[] },
    businessId: string,
  ): Promise<ApiResponse<Event[]>> {
    const duration = createEventDto.endDate.getTime() - createEventDto.startDate.getTime();
    const recurrentId = randomUUID();

    try {
      const savedEvents = await this.dataSource.transaction(async (manager) => {
        const events: Event[] = [];

        for (const startDate of createEventDto.recurringDates) {
          const endDate = new Date(startDate.getTime() + duration);

          const overlapping = await manager.findOne(Event, {
            where: {
              businessId,
              professionalId: createEventDto.professionalId,
              startDate: LessThan(endDate),
              endDate: MoreThan(startDate),
            },
          });

          if (overlapping) {
            throw new HttpException("Uno o más horarios ya están tomados", HttpStatus.CONFLICT);
          }

          const event = manager.create(Event, {
            ...createEventDto,
            businessId,
            startDate,
            endDate,
            recurrentId,
          });
          events.push(await manager.save(event));
        }

        return events;
      });

      return ApiResponse.created<Event[]>("Turnos recurrentes creados", savedEvents);
    } catch (error: any) {
      if (error?.driverError?.code === "23505") {
        throw new HttpException("Uno o más horarios ya están tomados", HttpStatus.CONFLICT);
      }

      throw new HttpException("Error al crear los turnos recurrentes", HttpStatus.INTERNAL_SERVER_ERROR);
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
    recurrent?: string,
    status?: string,
    sortBy?: string,
    sortOrder?: string,
  ): Promise<ApiResponse<IPaginationResponse<Event>>> {
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
    if (recurrent === "true") {
      baseQb.andWhere("event.recurrentId IS NOT NULL");
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

    const siblingsMap = await this.buildSiblingsMap(events);

    const result = events.map((event) => ({
      ...event,
      siblings: event.recurrentId ? (siblingsMap.get(event.recurrentId) ?? []) : null,
    }));

    const response: IPaginationResponse<Event> = {
      result,
      total: total,
    };

    return ApiResponse.success<IPaginationResponse<Event>>("Turnos encontrados", response);
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
      query.andWhere("event.startDate <= :endDate", { endDate });
      query.andWhere("event.endDate >= :startDate", { startDate });
    } else if (startDate) {
      query.andWhere("event.endDate >= :startDate", { startDate });
    } else if (endDate) {
      query.andWhere("event.startDate <= :endDate", { endDate });
    }

    const events = await query.getMany();
    if (!events) throw new HttpException("Error al obtener los turnos", HttpStatus.NOT_FOUND);

    const siblingsMap = await this.buildSiblingsMap(events);

    const result = events.map((event) => ({
      ...event,
      siblings: event.recurrentId ? (siblingsMap.get(event.recurrentId) ?? []) : null,
    }));

    return ApiResponse.success<Event[]>("Turnos encontrados", result);
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
    const event = await this.findOneById(id, businessId);

    if (!event.recurrentId) {
      const result = await this.eventRepository.remove(event);
      if (!result) throw new HttpException("Error al eliminar turno", HttpStatus.BAD_REQUEST);
      return ApiResponse.removed<Event>("Turno eliminado", result);
    }

    const siblings = await this.eventRepository.find({
      where: { recurrentId: event.recurrentId, businessId },
      select: ["id"],
    });

    await this.dataSource.transaction(async (manager) => {
      await manager.remove(Event, event);

      if (siblings.length === 2) {
        const remainingSibling = siblings.find((s) => s.id !== id);
        if (remainingSibling) {
          await manager.update(Event, { id: remainingSibling.id }, { recurrentId: null });
        }
      }
    });

    return ApiResponse.removed<Event>("Turno eliminado", event);
  }

  async checkRecurring(
    businessId: string,
    professionalId: string,
    startDate: string,
    days: string,
  ): Promise<
    ApiResponse<{
      dates: { date: Date; available: boolean }[];
      suggestions: { sameDay: Date[]; otherDaysSameHour: Date[]; otherDaysAnyHour: Date[] };
    }>
  > {
    const profile = await this.professionalProfileService.findByUserId(professionalId, businessId);
    if (!profile) throw new HttpException("Perfil profesional no encontrado", HttpStatus.NOT_FOUND);

    const date = new Date(startDate);
    const numDays = Number(days);
    const slotMs = parseInt(profile.slotDuration, 10) * 60 * 1000;
    const _recurringDays = this.generateRecurringDates(date, numDays);

    const horizonStart = new Date(date.getTime() - 24 * 60 * 60 * 1000);
    const horizonEnd = new Date(date.getTime() + (7 + (numDays - 1) * 7) * 24 * 60 * 60 * 1000 + slotMs);

    const eventsInHorizon = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .andWhere("event.startDate < :horizonEnd", { horizonEnd: horizonEnd.toISOString() })
      .andWhere("event.endDate > :horizonStart", { horizonStart: horizonStart.toISOString() })
      .select(["event.startDate", "event.endDate"])
      .getMany();

    const intervals = eventsInHorizon
      .map((e) => ({ start: e.startDate.getTime(), end: e.endDate.getTime() }))
      .sort((a, b) => a.start - b.start);

    const conflictsExisting = (start: number, end: number): boolean => {
      for (const i of intervals) {
        if (i.start >= end) break;
        if (i.end > start) return true;
      }
      return false;
    };

    const dates = _recurringDays.map((d) => {
      const start = d.getTime();
      return { date: d, available: !conflictsExisting(start, start + slotMs) };
    });

    const emptySuggestions = { sameDay: [] as Date[], otherDaysSameHour: [] as Date[], otherDaysAnyHour: [] as Date[] };
    if (dates.every((d) => d.available)) {
      return ApiResponse.success("Recurrencia verificada", { dates, suggestions: emptySuggestions });
    }

    const suggestions = this.buildRecurringSuggestions({
      originalStart: date,
      days: numDays,
      profile,
      conflictsExisting,
      slotMs,
    });

    return ApiResponse.success("Recurrencia verificada", { dates, suggestions });
  }

  async checkScheduleImpact(businessId: string, dto: ScheduleImpactDto): Promise<ApiResponse<IScheduleImpactResponse>> {
    const { professionalId, startHour, endHour, workingDays } = dto;

    const events = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.businessId = :businessId", { businessId })
      .andWhere("event.professionalId = :professionalId", { professionalId })
      .andWhere("event.status = :status", { status: EEventStatus.PENDING })
      .andWhere(
        `(event.start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date >= (NOW() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date`,
      )
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            `EXTRACT(DOW FROM event.start_date AT TIME ZONE 'America/Argentina/Buenos_Aires') NOT IN (:...workingDays)`,
            { workingDays },
          )
            .orWhere(`(event.start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time < :startHour::time`, {
              startHour,
            })
            .orWhere(`(event.start_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::time >= :endHour::time`, {
              endHour,
            });
        }),
      )
      .leftJoin("event.user", "user")
      .leftJoin("user.role", "userRole")
      .select(["event", ...EVENT_USER_SELECT, ...EVENT_ROLE_SELECT])
      .orderBy("event.start_date", "ASC")
      .getMany();

    return ApiResponse.success<IScheduleImpactResponse>("Impacto calculado", {
      affectedCount: events.length,
      events,
    });
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

  private generateRecurringDates(startDate: Date, amount: number): Date[] {
    const dates: Date[] = [];

    for (let i = 0; i < amount; i++) {
      const date = new Date(startDate.getTime());
      date.setUTCDate(date.getUTCDate() + i * 7);
      dates.push(date);
    }

    return dates;
  }

  private buildRecurringSuggestions(params: {
    originalStart: Date;
    days: number;
    profile: ProfessionalProfile;
    conflictsExisting: (start: number, end: number) => boolean;
    slotMs: number;
  }): { sameDay: Date[]; otherDaysSameHour: Date[]; otherDaysAnyHour: Date[] } {
    const { originalStart, days, profile, conflictsExisting, slotMs } = params;
    const MAX_PER_TIER = 3;

    const [startH, startM] = profile.startHour.split(":").map(Number);
    const [endH, endM] = profile.endHour.split(":").map(Number);
    const exStart = profile.dailyExceptionStart ? profile.dailyExceptionStart.split(":").map(Number) : null;
    const exEnd = profile.dailyExceptionEnd ? profile.dailyExceptionEnd.split(":").map(Number) : null;
    const slotDurationMin = parseInt(profile.slotDuration, 10);
    const tzOffset = parseInt(this.TIME_ZONE, 10);
    const scheduleStart = startH * 60 + startM;
    const scheduleEnd = endH * 60 + endM;
    const workingDays = profile.workingDays.map(Number);

    const isWithinSchedule = (candidate: Date): boolean => {
      const localDay = new Date(candidate.getTime() + tzOffset * 3600 * 1000).getUTCDay();
      if (!workingDays.includes(localDay)) return false;

      const localHours = candidate.getUTCHours() + tzOffset;
      const totalMinutes = localHours * 60 + candidate.getUTCMinutes();

      if (totalMinutes < scheduleStart || totalMinutes + slotDurationMin > scheduleEnd) return false;

      if (exStart && exEnd) {
        const exStartMin = exStart[0] * 60 + exStart[1];
        const exEndMin = exEnd[0] * 60 + exEnd[1];
        if (totalMinutes >= exStartMin && totalMinutes < exEndMin) return false;
      }

      return true;
    };

    const isSeriesFree = (candidateStart: Date): boolean => {
      if (!isWithinSchedule(candidateStart)) return false;
      const candidates = this.generateRecurringDates(candidateStart, days);
      for (const c of candidates) {
        if (!isWithinSchedule(c)) return false;
        const start = c.getTime();
        if (conflictsExisting(start, start + slotMs)) return false;
      }
      return true;
    };

    // Tier 1: same day, different hours
    const sameDay: Date[] = [];
    for (
      let min = scheduleStart;
      min + slotDurationMin <= scheduleEnd && sameDay.length < MAX_PER_TIER;
      min += slotDurationMin
    ) {
      const candidate = new Date(originalStart.getTime());
      candidate.setUTCHours(Math.floor(min / 60) - tzOffset, min % 60, 0, 0);
      if (candidate.getTime() === originalStart.getTime()) continue;
      if (isSeriesFree(candidate)) sameDay.push(candidate);
    }

    // Tier 2: other days, same hour
    const otherDaysSameHour: Date[] = [];
    for (let day = 1; day <= 7 && otherDaysSameHour.length < MAX_PER_TIER; day++) {
      const candidate = new Date(originalStart.getTime());
      candidate.setUTCDate(candidate.getUTCDate() + day);
      if (isSeriesFree(candidate)) otherDaysSameHour.push(candidate);
    }

    // Tier 3: other days, any hour (deduplicated against Tier 2)
    const tier2Set = new Set(otherDaysSameHour.map((d) => d.getTime()));
    const otherDaysAnyHour: Date[] = [];
    outer: for (let day = 1; day <= 7; day++) {
      for (let min = scheduleStart; min + slotDurationMin <= scheduleEnd; min += slotDurationMin) {
        if (otherDaysAnyHour.length >= MAX_PER_TIER) break outer;
        const candidate = new Date(originalStart.getTime());
        candidate.setUTCDate(candidate.getUTCDate() + day);
        candidate.setUTCHours(Math.floor(min / 60) - tzOffset, min % 60, 0, 0);
        if (tier2Set.has(candidate.getTime())) continue;
        if (isSeriesFree(candidate)) otherDaysAnyHour.push(candidate);
      }
    }

    return { sameDay, otherDaysSameHour, otherDaysAnyHour };
  }

  private async buildSiblingsMap(events: Event[]): Promise<Map<string, Event[]>> {
    const recurrentIds = [...new Set(events.map((e) => e.recurrentId).filter((id) => id !== null))];
    const siblingsMap = new Map<string, Event[]>();
    if (recurrentIds.length === 0) return siblingsMap;

    const siblings = await this.eventRepository
      .createQueryBuilder("event")
      .where("event.recurrentId IN (:...recurrentIds)", { recurrentIds })
      .orderBy("event.startDate", "ASC")
      .getMany();

    for (const recurrentId of recurrentIds) {
      siblingsMap.set(
        recurrentId,
        siblings.filter((s) => s.recurrentId === recurrentId),
      );
    }

    return siblingsMap;
  }
}
