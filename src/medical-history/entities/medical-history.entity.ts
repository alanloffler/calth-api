import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Event } from "@events/entities/event.entity";
import { User } from "@users/entities/user.entity";

@Entity("medical_history")
@Index("idx_mh_business_user", ["businessId", "userId"])
@Index("idx_mh_business_event", ["businessId", "eventId"])
@Index("idx_mh_business_user_created", ["businessId", "userId", "createdAt"])
export class MedicalHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "business_id", type: "uuid", nullable: false })
  businessId: string;

  @Column({ name: "user_id", type: "uuid", nullable: false })
  userId: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "professional_id", type: "uuid", nullable: true })
  professionalId: string;

  @ManyToOne(() => User, { onDelete: "SET NULL" })
  @JoinColumn({ name: "professional_id" })
  professional: User;

  @Column({ type: "timestamptz", nullable: false })
  date: Date;

  @Column({ name: "event_id", type: "uuid", nullable: true })
  eventId: string;

  @ManyToOne(() => Event, { onDelete: "SET NULL" })
  @JoinColumn({ name: "event_id" })
  event: Event;

  @Column({ type: "varchar", nullable: false })
  reason: string;

  @Column({ default: false, type: "boolean", nullable: false })
  recipe: boolean;

  @Column({ type: "varchar", nullable: false })
  comments: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
