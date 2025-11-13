import Knex from 'knex';
import knexConfig from '../knexfile.js';

const knex = Knex(knexConfig.development);

export default knex;
