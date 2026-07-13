import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  ownerEmail: text("owner_email").notNull(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  objectKey: text("object_key").notNull(),
  duration: integer("duration_ms").notNull().default(0),
  editState: text("edit_state").notNull().default("{}"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
