import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/core';

import { Property } from '../src/Property';
import { Car } from './entities/Car';
import { initORM } from './utils/init-orm';
import { Resource } from '../src/Resource';

const findProperty = (properties: Array<Property>, field: string): Property | undefined => properties.find(
  (p) => p.getColumnMetadata().name === field,
);

describe('Property', () => {
  let properties: Array<Property>;
  let orm: MikroORM;
  let resource: Resource;

  beforeAll(async () => {
    orm = await initORM();
    Resource.setORM(orm);
    resource = new Resource(Car);
    properties = resource.properties();
  });

  afterAll(async () => {
    await orm?.close();
  });

  describe('#name', () => {
    it('returns a name of the property', () => {
      const property = findProperty(properties, 'id');

      expect(property?.name()).toEqual('id');
    });
  });

  describe('#path', () => {
    it('returns the path of the property', () => {
      const property = findProperty(properties, 'name');

      expect(property?.path()).toEqual('name');
    });
  });

  describe('#isId', () => {
    it('returns true for primary key', () => {
      const property = findProperty(properties, 'id');

      expect(property?.isId()).toEqual(true);
    });

    it('returns false for regular column', () => {
      const property = findProperty(properties, 'name');

      expect(property?.isId()).toEqual(false);
    });
  });

  describe('#isEditable', () => {
    it('returns false for id field', async () => {
      const property = findProperty(properties, 'id');

      expect(property?.isEditable()).toEqual(false);
    });

    it('returns false for createdAt and updatedAt fields', async () => {
      const createdAt = findProperty(properties, 'createdAt');
      const updatedAt = findProperty(properties, 'updatedAt');

      expect(createdAt?.isEditable()).toEqual(false);
      expect(updatedAt?.isEditable()).toEqual(false);
    });

    it('returns true for a regular field', async () => {
      const property = findProperty(properties, 'name');

      expect(property?.isEditable()).toEqual(true);
    });
  });

  describe('#reference', () => {
    it('returns the name of the referenced resource if any', () => {
      const property = findProperty(properties, 'owner');

      expect(property?.reference()).toEqual('User');
    });

    it('returns null for regular field', () => {
      const property = findProperty(properties, 'name');

      expect(property?.reference()).toEqual(null);
    });
  });

  describe('#availableValues', () => {
    it('returns null for regular field', () => {
      const property = findProperty(properties, 'name');

      expect(property?.availableValues()).toEqual(null);
    });

    it('returns available values when enum is given', () => {
      const property = findProperty(properties, 'type');

      expect(property?.availableValues()).toEqual([
        'modern',
        'old',
      ]);
    });
  });

  describe('#type', () => {
    it('returns mixed type for an jsonb property', () => {
      const property = findProperty(properties, 'meta');

      expect(property?.type()).toEqual('mixed');
    });
  });
});
