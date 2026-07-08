/**
 * Espelho Drizzle do schema `public`.
 * As migrations CANÔNICAS (DDL + RLS + funções) vivem em supabase/migrations/ —
 * este arquivo existe só para queries tipadas no app. Mudou o SQL? Atualize aqui.
 */
import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const orgType = pgEnum("org_type", [
  "platform",
  "client",
  "partner_agency",
  "agency_client",
  "independent",
]);

export const orgStatus = pgEnum("org_status", ["active", "suspended"]);

export const dataClassification = pgEnum("data_classification", [
  "public",
  "internal",
  "client",
  "pii",
  "secret",
  "financial",
  "legal",
  "restricted_ai",
]);

export const membershipStatus = pgEnum("membership_status", [
  "active",
  "suspended",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentOrgId: uuid("parent_org_id"),
  orgType: orgType("org_type").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  status: orgStatus("status").notNull().default("active"),
  branding: jsonb("branding")
    .$type<{ primary_color?: string; logo_url?: string }>()
    .notNull()
    .default({}),
  locale: text("locale").notNull().default("pt-BR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  displayName: text("display_name"),
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name"),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id),
    status: membershipStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.orgId)],
);

export const oauthAccounts = pgTable("oauth_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  label: text("label"),
  /** SEMPRE ciphertext AES-256-GCM (src/server/crypto.ts) — nunca token em claro (CA3). */
  encryptedAccessToken: text("encrypted_access_token").notNull(),
  encryptedRefreshToken: text("encrypted_refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** null = ação de plataforma (fora de tenant). */
  tenantId: uuid("tenant_id"),
  actorUserId: uuid("actor_user_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  /** PROIBIDO PII aqui (ids sim; e-mail/nome/token não). */
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const incidentSeverity = pgEnum("incident_severity", [
  "info",
  "warning",
  "critical",
]);

export const incidentStatus = pgEnum("incident_status", [
  "open",
  "acknowledged",
  "resolved",
]);

/** Incidentes (mod-observabilidade). tenant_id null = plataforma. */
export const incidents = pgTable("incidents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id"),
  source: text("source").notNull(),
  severity: incidentSeverity("severity").notNull().default("warning"),
  status: incidentStatus("status").notNull().default("open"),
  title: text("title").notNull(),
  /** SEM PII/segredo — só ids/códigos/contagens. */
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
  correlationId: text("correlation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Finalidades de tratamento LGPD (mod-lgpd, RF2). */
export const processingPurposes = pgTable("processing_purposes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  purpose: text("purpose").notNull(),
  legalBasis: text("legal_basis").notNull(),
  dataClasses: dataClassification("data_classes").array().notNull(),
  externalAiAllowed: boolean("external_ai_allowed").notNull().default(false),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Consentimentos por finalidade (mod-lgpd, RF4). subject_label = pseudônimo. */
export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  purposeId: uuid("purpose_id")
    .notNull()
    .references(() => processingPurposes.id, { onDelete: "cascade" }),
  subjectLabel: text("subject_label").notNull(),
  granted: boolean("granted").notNull().default(true),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Tabela de produto CANÔNICA — todo módulo futuro copia este padrão (RF5). */
export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  classification: dataClassification("classification").notNull().default("internal"),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const credentialStatus = pgEnum("credential_status", [
  "active",
  "expired",
  "compromised",
  "revoked",
  "rotating",
]);

/** Cofre (cofre-senhas): colunas encrypted_* são SEMPRE ciphertext (CA1). */
export const vaultCredentials = pgTable("vault_credentials", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  label: text("label").notNull(),
  status: credentialStatus("status").notNull().default("active"),
  ownerUserId: uuid("owner_user_id"),
  encryptedUsername: text("encrypted_username"),
  encryptedPassword: text("encrypted_password"),
  encryptedToken: text("encrypted_token"),
  encryptedRecoveryCodes: text("encrypted_recovery_codes"),
  encryptedNotes: text("encrypted_notes"),
  classification: dataClassification("classification").notNull().default("secret"),
  rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
