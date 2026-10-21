import {
  boolean,
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { Block } from "@/lib/blocks";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** Legacy student profiles are retained for attribution on existing public posts. */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  studentNumber: text("student_number").notNull().default(""),
  university: text("university").notNull().default(""),
  className: text("class_name").notNull().default(""),
  professorName: text("professor_name").notNull().default(""),
  classTime: text("class_time").notNull().default(""),
  bio: text("bio").notNull().default(""),
  role: text("role").notNull().default("student"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Uploaded binary assets (images + attachments), stored in the database. */
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  alt: text("alt").notNull().default(""),
  caption: text("caption").notNull().default(""),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  /** Legacy author. New owner-authored posts do not require a database account. */
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull(), // assignment | research | presentation | notes
  course: text("course").notNull().default(""),
  summary: text("summary").notNull().default(""),
  content: jsonb("content").$type<Block[]>().notNull().default([]),
  plain: text("plain").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  status: text("status").notNull().default("draft"), // draft | published
  hiddenByAdmin: boolean("hidden_by_admin").notNull().default(false),
  moderationNote: text("moderation_note").notNull().default(""),
  coverFileId: integer("cover_file_id").references(() => files.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** Anonymous «I saw this» stamps; each browser token can stamp each post once. */
export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    reviewerName: text("reviewer_name").notNull().default("بازدیدکننده"),
    note: text("note").notNull().default(""),
    visitorTokenHash: text("visitor_token_hash"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("reviews_item_visitor_unique").on(table.itemId, table.visitorTokenHash)],
);

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

/** Persistent IP-hash buckets limit guessing on the single administrator login. */
export const adminLoginAttempts = pgTable("admin_login_attempts", {
  ipHash: text("ip_hash").primaryKey(),
  attempts: integer("attempts").notNull().default(0),
  windowStartedAt: timestamp("window_started_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type FileRow = typeof files.$inferSelect;
export type Review = typeof reviews.$inferSelect;
