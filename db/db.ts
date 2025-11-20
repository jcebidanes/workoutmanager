import Knex from 'knex';
import { databaseConfig } from '../config/env.ts';

const knex = Knex(databaseConfig);

export default knex;
