import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";

@Entity("blocked_days")
@Unique("uq_blocked_days_unique", ["businessId", "professionalId", "date"])
@Index("idx_blocked_days_business_professional", ["businessId", "professionalId", "date"])
@Index("idx_blocked_days_business_professional_recurrent", ["businessId", "professionalId"], {
  where: '"recurrent" = true',
})
export class BlockedDay {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamptz", nullable: false })
  date: Date;

  @Column({ type: "varchar", nullable: false, length: 50 })
  reason: string;

  @Column({ name: "business_id", type: "uuid", nullable: false })
  businessId: string;

  @Column({ name: "professional_id", type: "uuid", nullable: false })
  professionalId: string;

  @Column({ type: "boolean", nullable: false, default: false })
  recurrent: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
