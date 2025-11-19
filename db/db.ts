import Knex from 'knex';
// @ts-expect-error - knex configuration is defined in JS for CLI compatibility
import knexConfig from '../knexfile.js';

const knex = Knex(knexConfig.development);

export default knex;
