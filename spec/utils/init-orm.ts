import { MikroORM } from '@mikro-orm/core';

import { User, Car, Seller } from '../entities';
import { setupDb } from './setup-db';

export const initORM = (): Promise<MikroORM> => setupDb().then(() => MikroORM.init({
  entities: [User, Car, Seller],
  dbName: process.env.DATABASE_NAME,
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  debug: true,
}));
