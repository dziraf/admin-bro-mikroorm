import { EntityProperty } from '@mikro-orm/core';
import { BaseProperty, PropertyType } from 'admin-bro';
import { DATA_TYPES } from './utils/data-types';

export class Property extends BaseProperty {
  private column: EntityProperty;

  private columnPosition: number;

  constructor(column: EntityProperty, columnPosition = 0) {
    const path = column.name;
    super({ path });
    this.column = column;
    this.columnPosition = columnPosition;
  }

  public getColumnMetadata() {
    return this.column;
  }

  public isEditable(): boolean {
    return !this.isId() && this.column.name !== 'createdAt' && this.column.name !== 'updatedAt';
  }

  public isId(): boolean {
    return !!this.column.primary;
  }

  public isSortable(): boolean {
    return this.type() !== 'reference';
  }

  public reference(): string | null {
    const isRef = ['1:1', 'm:1'].includes(this.column.reference);
    if (isRef) {
      return this.column.targetMeta?.name ?? this.column.type;
    }
    return null;
  }

  public availableValues(): Array<string> | null {
    const isEnum = !!this.column.enum && !!this.column.items;
    if (isEnum) return this.column.items?.map((i) => String(i)) ?? [];
    return null;
  }

  public position(): number {
    return this.columnPosition || 0;
  }

  public isEnum(): boolean {
    return this.column.type === 'enum';
  }

  public type(): PropertyType {
    let type: PropertyType = DATA_TYPES[this.column.columnTypes[0]];

    if (this.reference()) { type = 'reference'; }

    // eslint-disable-next-line no-console
    if (!type) { console.warn(`Unhandled type: ${this.column.type}`); }

    return type;
  }
}
