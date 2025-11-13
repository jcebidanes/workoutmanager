import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('workout_templates', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description').defaultTo('');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('template_exercises', (table) => {
    table.increments('id').primary();
    table
      .integer('template_id')
      .notNullable()
      .references('id')
      .inTable('workout_templates')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('muscle_group').notNullable();
    table.string('difficulty_level').notNullable();
    table.integer('position').notNullable().defaultTo(0);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('template_sets', (table) => {
    table.increments('id').primary();
    table
      .integer('exercise_id')
      .notNullable()
      .references('id')
      .inTable('template_exercises')
      .onDelete('CASCADE');
    table.integer('set_number').notNullable().defaultTo(1);
    table.float('weight').notNullable().defaultTo(0);
    table.integer('reps').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('clients', (table) => {
    table.increments('id').primary();
    table
      .integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('email');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('client_workouts', (table) => {
    table.increments('id').primary();
    table
      .integer('client_id')
      .notNullable()
      .references('id')
      .inTable('clients')
      .onDelete('CASCADE');
    table
      .integer('template_id')
      .references('id')
      .inTable('workout_templates')
      .onDelete('SET NULL');
    table.string('name').notNullable();
    table.text('description').defaultTo('');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('client_exercises', (table) => {
    table.increments('id').primary();
    table
      .integer('client_workout_id')
      .notNullable()
      .references('id')
      .inTable('client_workouts')
      .onDelete('CASCADE');
    table
      .integer('template_exercise_id')
      .references('id')
      .inTable('template_exercises')
      .onDelete('SET NULL');
    table.string('name').notNullable();
    table.string('muscle_group').notNullable();
    table.string('difficulty_level').notNullable();
    table.integer('position').notNullable().defaultTo(0);
  });

  await knex.schema.createTable('client_sets', (table) => {
    table.increments('id').primary();
    table
      .integer('client_exercise_id')
      .notNullable()
      .references('id')
      .inTable('client_exercises')
      .onDelete('CASCADE');
    table.integer('set_number').notNullable().defaultTo(1);
    table.float('weight').notNullable().defaultTo(0);
    table.integer('reps').notNullable().defaultTo(0);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('client_sets');
  await knex.schema.dropTableIfExists('client_exercises');
  await knex.schema.dropTableIfExists('client_workouts');
  await knex.schema.dropTableIfExists('clients');
  await knex.schema.dropTableIfExists('template_sets');
  await knex.schema.dropTableIfExists('template_exercises');
  await knex.schema.dropTableIfExists('workout_templates');
}

