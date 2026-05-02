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

import { BusinessRolePermission } from "@business-role-permissions/entities/business-role-permission.entity";
import { RolePermission } from "@roles/entities/role-permission.entity";

@Entity()
@Index("idx_permission_action_key", ["actionKey"], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  category: string;

  @Column({ type: "varchar", length: 100, name: "action_key", nullable: false })
  actionKey: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  description: string;

  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];

  @OneToMany(() => BusinessRolePermission, (brp) => brp.permission)
  businessRolePermissions: BusinessRolePermission[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}
