import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Query } from "@nestjs/common";

import { BusinessId } from "@common/decorators/business-id.decorator";
import { CreateEventDto } from "@events/dto/create-event.dto";
import { EEventStatus } from "@common/enums/event-status.enum";
import { EventsService } from "@events/events.service";
import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@auth/guards/permissions.guard";
import { RequiredPermissions } from "@auth/decorators/required-permissions.decorator";
import { ScheduleImpactDto } from "@events/dto/schedule-impact.dto";
import { UpdateEventDto } from "@events/dto/update-event.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @RequiredPermissions("events-create")
  @Post()
  create(@Body() createEventDto: CreateEventDto, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.eventsService.create(createEventDto, businessId);
  }

  @RequiredPermissions("events-view")
  @Get("days-with-events/:professionalId")
  findDaysWithEvents(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
    @Query("fromDate") fromDate?: string,
    @Query("toDate") toDate?: string,
  ) {
    return this.eventsService.findDaysWithEvents(businessId, professionalId, fromDate, toDate);
  }

  // Maybe remove and use only with data,
  @RequiredPermissions("events-view")
  @Get("professional/:professionalId")
  findAll(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    return this.eventsService.findAll(businessId, professionalId, startDate, endDate);
  }

  @RequiredPermissions("events-view")
  @Get("professional/:professionalId/date/:date")
  findAllByDate(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
    @Param("date") date: string,
  ) {
    return this.eventsService.findAllByDate(businessId, professionalId, date);
  }

  @RequiredPermissions("events-view")
  @Get("professional/:professionalId/date-array/:date")
  findAllByDateArray(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("professionalId", ParseUUIDPipe) professionalId: string,
    @Param("date") date: string,
  ) {
    return this.eventsService.findAllByDateArray(businessId, professionalId, date);
  }

  @RequiredPermissions("events-view")
  @Get("patient/:patientId")
  findAllByPatient(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Param("patientId", ParseUUIDPipe) patientId: string,
    @Query("professional", ParseUUIDPipe) professionalId: string,
  ) {
    return this.eventsService.findByBusinessProfessionalPatient(businessId, patientId, professionalId);
  }

  @RequiredPermissions("events-create")
  @Get("check-recurring")
  checkRecurring(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Query("professionalId", ParseUUIDPipe) professionalId: string,
    @Query("startDate") startDate: string,
    @Query("days") days: string,
  ) {
    return this.eventsService.checkRecurring(businessId, professionalId, startDate, days);
  }

  @RequiredPermissions("events-view")
  @Post("schedule-impact")
  checkScheduleImpact(@BusinessId(ParseUUIDPipe) businessId: string, @Body() dto: ScheduleImpactDto) {
    return this.eventsService.checkScheduleImpact(businessId, dto);
  }

  @RequiredPermissions("events-view")
  @Get("needs-reschedule")
  findNeedsReschedule(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Query("professionalId", new ParseUUIDPipe({ optional: true })) professionalId?: string,
  ) {
    return this.eventsService.findNeedsReschedule(businessId, professionalId);
  }

  @RequiredPermissions("events-view")
  @Get("business")
  findAllByBusiness(@BusinessId(ParseUUIDPipe) businessId: string, @Query("limit") limit: string) {
    return this.eventsService.findAllByBusiness(businessId, limit);
  }

  @RequiredPermissions("events-view")
  @Get("filtered")
  findEventsFiltered(
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Query("limit") limit: string,
    @Query("date") date?: string,
    @Query("page") page?: string,
    @Query("patientId") patientId?: string,
    @Query("professionalId") professionalId?: string,
    @Query("recurrent") recurrent?: string,
    @Query("needsReschedule") needsReschedule?: string,
    @Query("status") status?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.eventsService.findEventsFiltered(
      businessId,
      limit,
      date,
      page,
      patientId,
      professionalId,
      recurrent,
      needsReschedule,
      status,
      sortBy,
      sortOrder,
    );
  }

  @RequiredPermissions("events-view")
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.eventsService.findOne(id, businessId);
  }

  @RequiredPermissions("events-update")
  @Patch(":id/status")
  updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @BusinessId(ParseUUIDPipe) businessId: string,
    @Body("status") status: EEventStatus,
  ) {
    return this.eventsService.updateStatus(id, businessId, status);
  }

  @RequiredPermissions("events-update")
  @Patch(":id")
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @BusinessId(ParseUUIDPipe) businessId: string,
  ) {
    return this.eventsService.update(id, updateEventDto, businessId);
  }

  @RequiredPermissions("events-delete-hard")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string, @BusinessId(ParseUUIDPipe) businessId: string) {
    return this.eventsService.remove(id, businessId);
  }
}
