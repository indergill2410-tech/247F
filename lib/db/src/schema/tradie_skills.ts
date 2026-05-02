import { pgTable, integer, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { categoriesTable } from "./categories";

export const tradieSkillsTable = pgTable(
  "tradie_skills",
  {
    tradieId: integer("tradie_id")
      .notNull()
      .references(() => usersTable.id),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categoriesTable.id),
  },
  (t) => [primaryKey({ columns: [t.tradieId, t.categoryId] })]
);

export type TradieSkill = typeof tradieSkillsTable.$inferSelect;
