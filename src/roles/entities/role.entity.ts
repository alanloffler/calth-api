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
import { User } from "@users/entities/user.entity";

@Entity()
@Index("idx_role_value", ["value"], { unique: true })
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  value: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: false })
  rolePermissions: RolePermission[];

  @OneToMany(() => BusinessRolePermission, (brp) => brp.role)
  businessPermissions: BusinessRolePermission[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt?: Date;
}
