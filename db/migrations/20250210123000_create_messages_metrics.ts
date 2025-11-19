import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasMessages = await knex.schema.hasTable('client_messages');
  if (!hasMessages) {
    await knex.schema.createTable('client_messages', (table) => {
      table.increments('id').primary();
      table.integer('client_id').unsigned().notNullable()
        .references('id').inTable('clients').onDelete('CASCADE');
      table.text('content').notNullable();
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }

  const hasMetrics = await knex.schema.hasTable('client_metrics');
  if (!hasMetrics) {
    await knex.schema.createTable('client_metrics', (table) => {
      table.increments('id').primary();
      table.integer('client_id').unsigned().notNullable()
        .references('id').inTable('clients').onDelete('CASCADE');
      table.string('name').notNullable();
      table.float('value').notNullable();
      table.string('unit').nullable();
      table.timestamp('recorded_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_metrics');
  await knex.schema.dropTableIfExists('client_messages');
}
