import 'reflect-metadata';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
/* eslint-disable import/first */
import express from 'express';
import AdminBro from 'admin-bro';
import AdminBroExpress from '@admin-bro/express';
import { Database, Resource } from 'admin-bro-mikroorm';
import { MikroORM } from '@mikro-orm/core';

import { User, Car, Seller } from './entities';
/* eslint-enable import/first */

const PORT = 3000;

const run = async () => {
  const orm = await MikroORM.init({
    entities: [User, Car, Seller],
    dbName: process.env.DATABASE_NAME,
    type: 'postgresql',
    clientUrl: process.env.DATABASE_URL,
    debug: true,
  });

  Resource.setORM(orm as any);
  AdminBro.registerAdapter({ Database, Resource });

  const app = express();

  const resources = [
    {
      resource: User,
      options: {
        properties: {
          firstName: {
            isTitle: true,
          },
        },
      },
    },
    {
      resource: Car,
      options: {
        properties: {
          meta: { type: 'mixed' },
          'meta.title': {
            type: 'string',
          },
          'meta.description': {
            type: 'string',
          },
        },
      },
    },
    Seller,
  ];

  const admin = new AdminBro({
    // databases: [orm],
    resources,
  });

  const router = AdminBroExpress.buildRouter(admin);

  app.use(admin.options.rootPath, router);

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Example app listening at http://localhost:${PORT}`);
  });
};

run();
