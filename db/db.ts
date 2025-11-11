import Knex from 'knex';
import knexConfig from '../knexfile.ts';

const knex = Knex(knexConfig.development);

export default knex;
