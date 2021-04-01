import { BaseDatabase } from 'admin-bro';
import { MikroORM } from '@mikro-orm/core';

import { Resource } from './Resource';

export class Database extends BaseDatabase {
  public constructor(public readonly orm: MikroORM) {
    super(orm);
    this.orm = orm;
  }

  public resources(): Array<Resource> {
    const metadata = this.orm.getMetadata();
    if (!metadata) return [];
    metadata.decorate(this.orm.em);

    Resource.setORM(this.orm);
    return Object.values(metadata.getAll()).reduce((memo: Resource[], meta) => {
      const resource = new Resource(meta.class);
      memo.push(resource);

      return memo;
    }, []);
  }

  public static isAdapterFor(orm: MikroORM): boolean {
    return !!orm.isConnected && orm.isConnected() && !!orm.getMetadata();
  }
}
