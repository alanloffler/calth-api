import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { Business } from "@business/entities/business.entity";
import { Permission } from "@permissions/entities/permission.entity";
import { Role } from "@roles/entities/role.entity";

export enum EPermissionEffect {
  GRANT = "grant",
  DENY = "deny",
}

@Entity("business_role_permissions")
@Index("idx_brp_business_role", ["businessId", "roleId"])
@Index("idx_brp_permission", ["permissionId"])
@Check(`"effect" IN ('grant', 'deny')`)
export class BusinessRolePermission {
  @PrimaryColumn("uuid", { name: "business_id" })
  businessId: string;

  @PrimaryColumn("uuid", { name: "role_id" })
  roleId: string;

  @PrimaryColumn("uuid", { name: "permission_id" })
  permissionId: string;

  @Column({ type: "varchar", length: 10, enum: EPermissionEffect })
  effect: EPermissionEffect;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => Business, (business) => business.rolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "business_id" })
  business: Business;

  @ManyToOne(() => Role, (role) => role.businessPermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "role_id" })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.businessRolePermissions, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "permission_id" })
  permission: Permission;
}
