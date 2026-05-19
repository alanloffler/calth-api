import { Event } from "@events/entities/event.entity";

export interface IScheduleImpactResponse {
  affectedCount: number;
  events: Event[];
}
