import {
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { Block } from "@/lib/blocks";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

/** Uploaded binary assets (images + attachments), stored in the database. */
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
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
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  type: text("type").notNull(), // assignment | research | presentation | notes
  course: text("course").notNull().default(""),
  summary: text("summary").notNull().default(""),
  content: jsonb("content").$type<Block[]>().notNull().default([]),
  plain: text("plain").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  status: text("status").notNull().default("draft"), // draft | published
  coverFileId: integer("cover_file_id").references(() => files.id),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/** «مشاهده شد» stamps left by the professor (public visitors). */
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  reviewerName: text("reviewer_name").notNull().default("استاد راهنما"),
  note: text("note").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default(""),
  university: text("university").notNull().default(""),
  course: text("course").notNull().default(""),
  email: text("email").notNull().default(""),
  bio: text("bio").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;
export type FileRow = typeof files.$inferSelect;
export type Review = typeof reviews.$inferSelect;
