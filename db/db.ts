import Knex from 'knex';
// @ts-expect-error - knex configuration is defined in JS for CLI compatibility
import knexConfig from '../knexfile.cjs';

type Environment = keyof typeof knexConfig;

const environment = (process.env.NODE_ENV as Environment) ?? 'development';
const config = knexConfig[environment] ?? knexConfig.development;

const knex = Knex(config);

export default knex;
