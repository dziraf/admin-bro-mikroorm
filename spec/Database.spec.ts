import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';

import { Database } from '../src/Database';
import { initORM } from './utils/init-orm';

describe('Database', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await initORM();
  });

  afterAll(async () => {
    await orm?.close();
  });

  describe('.isAdapterFor', () => {
    it('returns true when typeorm connection is given', () => {
      expect(Database.isAdapterFor(orm)).toEqual(true);
    });

    it('returns false for any other data', () => {
      expect(Database.isAdapterFor({} as any)).toEqual(false);
    });
  });

  describe('#resources', () => {
    it('returns all entities', async () => {
      expect(new Database(orm).resources()).toHaveLength(3);
    });
  });
});
