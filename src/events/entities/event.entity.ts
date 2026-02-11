import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from "typeorm";

import { EEventStatus } from "@common/enums/event-status.enum";
import { User } from "@users/entities/user.entity";

@Entity("events")
@Index("idx_events_business_start", ["businessId", "startDate"])
@Index("idx_events_business_professional_start", ["businessId", "professionalId", "startDate"], { unique: true })
@Index("idx_events_business_user_start", ["businessId", "userId", "startDate"])
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({ name: "start_date", type: "timestamptz", nullable: false })
  startDate: Date;

  @Column({ name: "end_date", type: "timestamptz", nullable: false })
  endDate: Date;

  @Column({ name: "business_id", type: "uuid", nullable: false })
  businessId: string;

  @Column({ name: "professional_id", type: "uuid", nullable: false })
  professionalId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "professional_id" })
  professional: User;

  @Column({ name: "user_id", type: "uuid", nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "enum", enum: EEventStatus, nullable: false, default: EEventStatus.PENDING })
  status: EEventStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
