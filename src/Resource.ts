/* eslint-disable no-param-reassign */
import { BaseResource, Filter, BaseRecord, ValidationError } from 'admin-bro';
import {
  AnyEntity,
  MikroORM,
  EntityMetadata,
  MetadataStorage,
  EntityManager,
  Loaded,
  wrap,
} from '@mikro-orm/core';
import { EntityClass } from '@mikro-orm/core/typings';
import flat from 'flat';

import { Property } from './Property';
import { convertFilter } from './utils/convert-filter';

export type AdapterORM = {
  database?: string;
  databaseType?: string;
  entityManager: EntityManager;
  metadata: MetadataStorage;
};

// eslint-disable-next-line max-len
const OrmNotFoundError = 'ORM is not set. Make sure to set it before registering the adapter: AdminBro.setORM(mikroOrmInstance)';

export class Resource extends BaseResource {
  public static orm: AdapterORM;

  public static validate: any;

  private metadata: EntityMetadata | undefined;

  private model: EntityClass<AnyEntity>;

  private propertiesObject: Record<string, Property>;

  constructor(model: EntityClass<AnyEntity>) {
    super(model);
    this.model = model;
    this.metadata = Resource.orm?.metadata?.find(model.name);
    this.propertiesObject = this.prepareProperties();
  }

  public static setORM(orm: MikroORM) {
    orm.getMetadata().decorate(orm.em);
    Resource.orm = Resource.stripOrmConfig(orm);
  }

  public databaseName(): string {
    return Resource.orm?.database || 'mikroorm';
  }

  public databaseType(): string {
    return Resource.orm?.databaseType || this.databaseName();
  }

  public name(): string {
    return this.metadata?.name ?? this.metadata?.className ?? '';
  }

  public id(): string {
    return this.name();
  }

  public properties(): Array<Property> {
    return [...Object.values(this.propertiesObject)];
  }

  public property(path: string): Property {
    return this.propertiesObject[path];
  }

  public build(params: Record<string, any>): BaseRecord {
    return new BaseRecord(flat.unflatten(params), this);
  }

  public async count(filter: Filter): Promise<number> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    return Resource.orm.entityManager.getRepository(this.model).count(
      convertFilter(filter),
    );
  }

  public async find(filter: Filter, params: Record<string, any> = {}): Promise<Array<BaseRecord>> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    const { limit = 10, offset = 0, sort = {} } = params;
    const { direction, sortBy } = sort as { direction: 'asc' | 'desc', sortBy: string };

    const results = await Resource.orm.entityManager
      .getRepository(this.model)
      .find(
        convertFilter(filter), {
          orderBy: {
            [sortBy]: direction,
          },
          limit,
          offset,
        },
      );

    return results.map((result) => new BaseRecord(wrap(result).toJSON(), this));
  }

  public async findOne(id: string | number): Promise<BaseRecord | null> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    const result = await Resource.orm.entityManager
      .getRepository(this.model)
      .findOne(id as any); // mikroorm has incorrect types for findOne

    if (!result) return null;

    return new BaseRecord(wrap(result).toJSON(), this);
  }

  public async findMany(
    ids: Array<string | number>,
  ): Promise<Array<BaseRecord>> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    const pk = this.metadata?.primaryKeys[0];
    if (!pk) return [];

    const results = await Resource.orm.entityManager
      .getRepository(this.model)
      .find({ [pk]: { $in: ids } });

    return results.map((result) => new BaseRecord(wrap(result).toJSON(), this));
  }

  public async create(params: Record<string, any>): Promise<Record<string, any>> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    const instance = Resource.orm?.entityManager
      .getRepository(this.model)
      .create(flat.unflatten(params));

    await this.validateAndSave(instance);

    const returnedParams: Record<string, any> = flat.flatten(wrap(instance).toJSON());

    return returnedParams;
  }

  public async update(pk: string | number, params: Record<string, any> = {}): Promise<Record<string, any>> {
    if (!Resource.orm) throw new Error(OrmNotFoundError);

    const instance = await Resource.orm?.entityManager
      .getRepository(this.model)
      .findOne(pk as any); // mikroorm has incorrect types for findOneOrFail

    if (!instance) throw new Error('Record to update not found');

    const updatedInstance = wrap(instance).assign(flat.unflatten(params));

    await this.validateAndSave(updatedInstance);

    const returnedParams: Record<string, any> = flat.flatten(wrap(updatedInstance).toJSON());

    return returnedParams;
  }

  public async delete(id: string | number): Promise<void> {
    if (!Resource.orm) return;

    await Resource.orm?.entityManager
      .getRepository(this.model)
      .nativeDelete(id as any); // mikroorm has incorrect types for nativeDelete
  }

  public static isAdapterFor(rawResource: EntityClass<AnyEntity>): boolean {
    try {
      if (Resource.orm === null) return false;
      const metadata = Resource.orm?.metadata?.find(rawResource.name);
      return !!metadata;
    } catch (e) {
      return false;
    }
  }

  public static stripOrmConfig(orm: MikroORM) {
    const {
      database,
    } = orm.config.getDriver().getConnection().getConnectionOptions();
    const databaseType = orm.config.getAll().type;
    const entityManager = orm.em;
    const metadata = orm.getMetadata();

    return { database, databaseType, entityManager, metadata };
  }

  async validateAndSave(instance: Loaded<AnyEntity>): Promise<void> {
    if (Resource.validate) {
      const errors = await Resource.validate(instance);
      if (errors && errors.length) {
        const validationErrors = errors.reduce(
          (memo, error) => ({
            ...memo,
            [error.property]: {
              type: Object.keys(error.constraints)[0],
              message: Object.values(error.constraints)[0],
            },
          }),
          {},
        );
        throw new ValidationError(validationErrors);
      }
    }
    try {
      await Resource.orm?.entityManager.persistAndFlush(instance);
    } catch (error) {
      if (error.name === 'QueryFailedError') {
        throw new ValidationError({
          [error.column]: {
            type: 'QueryFailedError',
            message: error.message,
          },
        });
      }
    }
  }

  private prepareProperties(): { [propertyPath: string]: Property } {
    const { hydrateProps = [] } = this.metadata ?? {};
    return hydrateProps.reduce((memo, prop, index) => {
      if (!['scalar', 'm:1', '1:1'].includes(prop.reference)) return memo;

      const property = new Property(prop, index);
      memo[property.path()] = property;

      return memo;
    }, {});
  }
}
