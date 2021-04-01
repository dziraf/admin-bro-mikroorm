import { Filter } from 'admin-bro';
import { FilterQuery, AnyEntity } from '@mikro-orm/core';
import { Property } from '../Property';

function safeParseJSON(json: string) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function convertFilter(filter?: Filter): FilterQuery<AnyEntity> {
  if (!filter) return {};

  const { filters = {} } = filter;
  return Object.entries(filters).reduce((where, [name, filter]) => {
    if (['boolean', 'number', 'float', 'object', 'array'].includes(filter.property.type())) {
      where[name] = safeParseJSON(filter.value as string);
    } else if (['date', 'datetime'].includes(filter.property.type())) {
      if (typeof filter.value !== 'string' && filter.value.from && filter.value.to) {
        where[name] = { $gte: new Date(filter.value.from), $lte: new Date(filter.value.to) };
      } else if (typeof filter.value !== 'string' && filter.value.from) {
        where[name] = { $gte: new Date(filter.value.from) };
      } else if (typeof filter.value !== 'string' && filter.value.to) {
        where[name] = { $lte: new Date(filter.value.to) };
      }
    } else if ((filter.property as Property).isEnum() || filter.property.type() === 'reference') {
      where[name] = filter.value;
    } else {
      where[name] = { $like: `%${filter.value.toString()}%` };
    }

    return where;
  }, {});
}
