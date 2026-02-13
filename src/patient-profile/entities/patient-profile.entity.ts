import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "@users/entities/user.entity";

@Entity()
@Index("idx_patient_profile_business", ["businessId"])
@Index("idx_patient_profile_business_user", ["businessId", "userId"])
@Index("uq_patient_profile_business_user", ["businessId", "userId"], { unique: true })
export class PatientProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "business_id", nullable: false })
  businessId: string;

  @Column({ type: "uuid", name: "user_id", nullable: false })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ nullable: false })
  gender: string;

  @Column({ name: "birth_day", type: "date", nullable: false })
  birthDay: Date;

  @Column({ name: "blood_type", nullable: false })
  bloodType: string;

  @Column({ nullable: false })
  weight: number;

  @Column({ nullable: false })
  height: number;

  @Column({ name: "emergency_contact_name", nullable: false })
  emergencyContactName: string;

  @Column({ name: "emergency_contact_phone", nullable: false })
  emergencyContactPhone: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date;
}
