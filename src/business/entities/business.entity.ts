import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { User } from "@users/entities/user.entity";

@Entity()
@Index("idx_business_slug", ["slug"], { unique: true })
@Index("idx_business_tax_id", ["taxId"], { unique: true })
export class Business {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  slug: string;

  @Column({ type: "varchar", length: 11, name: "tax_id", nullable: false })
  taxId: string;

  @Column({ type: "varchar", length: 100, name: "company_name", nullable: false })
  companyName: string;

  @Column({ type: "varchar", length: 100, name: "trade_name", nullable: false })
  tradeName: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  description: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  street: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  city: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  province: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  country: string;

  @Column({ type: "varchar", length: 10, name: "zip_code", nullable: false })
  zipCode: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  timezone: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  email: string;

  @Column({ type: "varchar", length: 10, name: "phone_number", nullable: false })
  phoneNumber: string;

  @Column({ type: "varchar", length: 10, name: "whatsapp_number", nullable: true })
  whatsAppNumber?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  website?: string;

  @OneToMany(() => User, (user) => user.business)
  users: User[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}
