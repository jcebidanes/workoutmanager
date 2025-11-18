import type { Knex } from 'knex';

const DEFAULT_LANGUAGE = 'en';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'language');
  if (!hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.string('language').notNullable().defaultTo(DEFAULT_LANGUAGE);
    });
  }

  await knex('users').update({ language: DEFAULT_LANGUAGE }).whereNull('language');
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('users', 'language');
  if (hasColumn) {
    await knex.schema.alterTable('users', (table) => {
      table.dropColumn('language');
    });
  }
}
