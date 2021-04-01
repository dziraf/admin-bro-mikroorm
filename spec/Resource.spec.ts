import 'reflect-metadata';
import { BaseProperty, BaseRecord, ValidationError, Filter } from 'admin-bro';
import { validate } from 'class-validator';
import { MikroORM } from '@mikro-orm/core';
import flat from 'flat';

import { Resource } from '../src/Resource';

import { Car, CarType } from './entities/Car';
import { initORM } from './utils/init-orm';
import { User } from './entities/User';
import { Seller } from './entities';

describe('Resource', () => {
  let resource: Resource;
  let orm: MikroORM;
  const data = {
    name: 'Hyundai i40',
    type: CarType.MODERN,
    'meta.title': 'Hyundai',
    'meta.description': 'Hyundai i40',
  };

  beforeAll(async () => {
    orm = await initORM();
  });

  beforeEach(async () => {
    resource = new Resource(Car);

    await orm.em.getRepository(Car).nativeDelete({});
    await orm.em.getRepository(User).nativeDelete({});
    await orm.em.getRepository(Seller).nativeDelete({});
  });

  afterAll(async () => {
    await orm.close();
  });

  describe('.isAdapterFor', () => {
    it('returns false if `orm` is not set before', () => {
      expect(Resource.isAdapterFor(Car)).toEqual(false);
    });

    it('returns true when Entity is given and `orm` is set', () => {
      Resource.setORM(orm);
      expect(Resource.isAdapterFor(Car)).toEqual(true);
    });

    it('returns false for any other kind of resources', () => {
      Resource.setORM(orm);
      expect(Resource.isAdapterFor({ Car: true } as any)).toEqual(false);
    });
  });

  describe('#databaseName', () => {
    it('returns correct database name', () => {
      expect(resource.databaseName()).toEqual(
        process.env.DATABASE_NAME || 'mikroorm_test',
      );
    });
  });

  describe('#databaseType', () => {
    it('returns database dialect', () => {
      expect(resource.databaseType()).toEqual('postgresql');
    });
  });

  describe('#name', () => {
    it('returns the name of the entity', () => {
      expect(resource.name()).toEqual('Car');
    });
  });

  describe('#properties', () => {
    it('returns all the properties', () => {
      expect(resource.properties()).toHaveLength(8);
    });

    it('returns all properties with the correct position', () => {
      expect(
        resource.properties().map((property) => property.position()),
      ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('#property', () => {
    it('returns selected property', () => {
      const property = resource.property('id');

      expect(property).toBeInstanceOf(BaseProperty);
    });
  });

  describe('#count', () => {
    it('returns number of records', async () => {
      expect(await resource.count({} as Filter)).toEqual(0);
    });
  });

  describe('#build flow with errors', () => {
    it('creates record with build flow', async () => {
      const record = resource.build({
        ...data,
      });

      await record.save();

      expect(record.errors).toEqual({});
    });
  });

  describe('#create', () => {
    it('returns params', async () => {
      const params = await resource.create(data);

      expect(params.id).toBeDefined();
    });

    it('stores Column with defined property', async () => {
      const params = await resource.create(data);
      const storedRecord = await orm.em.getRepository(Car).findOne(params.id as any);

      expect(storedRecord?.type).toEqual(data.type);
    });

    it('stores mixed type properties', async () => {
      const params = await resource.create(data);
      const storedRecord = await orm.em.getRepository(Car).findOne(params.id as any);

      expect(storedRecord?.meta).toEqual({
        title: data['meta.title'],
        description: data['meta.description'],
      });
    });

    it('throws ValidationError for defined validations', async () => {
      Resource.validate = validate;
      try {
        await resource.create({
          ...data,
          name: 'Fiat 126p',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const errors = (error as ValidationError).propertyErrors;
        const errorsArray = Object.entries(errors);
        expect(errorsArray).toHaveLength(1);
        expect(errorsArray[0][0]).toEqual('name');
        expect(errorsArray[0][1].type).toEqual('minLength');
      }
      Resource.validate = undefined;
    });
  });

  describe('#update', () => {
    let record: BaseRecord | null;

    beforeEach(async () => {
      const params = await resource.create({
        ...data,
      });
      record = await resource.findOne(params.id as any);
    });

    it('updates record name', async () => {
      const ford = 'Ford';
      await resource.update((record && record.id()) as string, {
        name: ford,
      });
      const recordInDb = await resource.findOne(
        (record && record.id()) as string,
      );

      expect(recordInDb && recordInDb.param('name')).toEqual(ford);
    });
  });

  describe('references', () => {
    let user: User;
    let seller: Seller;
    let car;

    beforeEach(async () => {
      user = orm.em.getRepository(User).create({
        firstName: 'John',
        lastName: 'Smith',
        age: 20,
        role: 'admin',
      });
      await orm.em.persistAndFlush(user);

      seller = orm.em.getRepository(Seller).create({
        name: 'Test',
      });
      await orm.em.persistAndFlush(seller);
    });

    it('creates new resource', async () => {
      car = await resource.create({
        ...data,
        owner: user.id,
        seller: seller.id,
      });

      expect(car.owner).toEqual(user.id);
      expect(car.seller).toEqual(seller.id);
    });
  });

  describe('#delete', () => {
    let car;

    beforeEach(async () => {
      car = orm.em.getRepository(Car).create(flat.unflatten({
        ...data,
      }));
      await orm.em.persistAndFlush(car);
    });

    it('deletes the resource', async () => {
      await resource.delete(car.id);
      expect(await resource.count({} as Filter)).toEqual(0);
    });
  });
});
