import { BaseEntity, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';
import { Car } from './Car';

export enum UserRoles {
  DESIGNER = 'designer',
  CLIENT = 'client',
}

@Entity()
export class Seller extends BaseEntity<Seller, 'id'> {
  @PrimaryKey({ columnType: 'uuid' })
  id = v4();

  @Property({ fieldName: 'name', columnType: 'text' })
  name: string;

  @OneToMany(() => Car, (car) => car.seller)
  cars: Car[];
}
