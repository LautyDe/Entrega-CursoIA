import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const userStates = sqliteTable("user_states", {
  userId: text("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  stateJson: text("state_json").notNull(),
  updatedAt: integer("updated_at").notNull(),
});
