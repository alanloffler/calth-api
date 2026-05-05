import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
@Index("idx_api_keys_business_id", ["businessId"])
@Index("uq_api_keys_business_name", ["businessId", "name"], { unique: true })
export class ApiKey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "business_id", nullable: false })
  businessId: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  name: string;

  @Column({ type: "text", nullable: false })
  key: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  linkedTo: string;

  @Column({ type: "boolean", default: false })
  active: boolean;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
