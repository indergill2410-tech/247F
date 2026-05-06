import { pgTable, serial, integer, boolean, text, timestamp, index } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { jobsTable } from "./jobs";

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobsTable.id, { onDelete: "cascade" }),
  homeownerId: integer("homeowner_id").notNull().references(() => usersTable.id),
  tradieId: integer("tradie_id").notNull().references(() => usersTable.id),
  lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  homeownerIdIdx: index("conversations_homeowner_id_idx").on(table.homeownerId),
  tradieIdIdx: index("conversations_tradie_id_idx").on(table.tradieId),
}));

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => usersTable.id),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  conversationIdIdx: index("messages_conversation_id_idx").on(table.conversationId),
  conversationSenderIdx: index("messages_conversation_sender_idx").on(table.conversationId, table.senderId),
  conversationReadIdx: index("messages_conversation_read_idx").on(table.conversationId, table.isRead),
}));

export type Conversation = typeof conversationsTable.$inferSelect;
export type Message = typeof messagesTable.$inferSelect;
