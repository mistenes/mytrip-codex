import crypto from 'crypto';

import { ensureSchema, query } from './client.js';

function camelToSnake(value) {
  return String(value)
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

function snakeToCamel(value) {
  return String(value).replace(/_([a-z])/g, (_match, char) => char.toUpperCase());
}

function normalizeDateValue(value) {
  if (!value) {
    return value;
  }

  return value instanceof Date ? value : new Date(value);
}

function compareValues(left, right, direction) {
  const multiplier = direction === -1 ? -1 : 1;
  const leftValue = left ?? '';
  const rightValue = right ?? '';

  if (leftValue < rightValue) {
    return -1 * multiplier;
  }
  if (leftValue > rightValue) {
    return 1 * multiplier;
  }
  return 0;
}

function matchOperator(actualValue, operator, expectedValue) {
  switch (operator) {
    case '$gt': {
      const normalizedActual = normalizeDateValue(actualValue);
      const normalizedExpected = normalizeDateValue(expectedValue);
      return normalizedActual > normalizedExpected;
    }
    case '$ne':
      return actualValue !== expectedValue;
    case '$exists':
      return expectedValue ? actualValue !== null && typeof actualValue !== 'undefined' : actualValue === null || typeof actualValue === 'undefined';
    case '$in':
      return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
    default:
      return false;
  }
}

function matchField(actualValue, expectedValue) {
  if (expectedValue && typeof expectedValue === 'object' && !Array.isArray(expectedValue) && !(expectedValue instanceof Date)) {
    const operators = Object.entries(expectedValue);
    if (operators.length > 0 && operators.every(([key]) => key.startsWith('$'))) {
      return operators.every(([operator, value]) => matchOperator(actualValue, operator, value));
    }
  }

  if (Array.isArray(actualValue)) {
    if (Array.isArray(expectedValue)) {
      return JSON.stringify(actualValue) === JSON.stringify(expectedValue);
    }

    return actualValue.map(String).includes(String(expectedValue));
  }

  return String(actualValue ?? '') === String(expectedValue ?? '');
}

function matchesFilter(document, filter = {}) {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  return Object.entries(filter).every(([key, expectedValue]) => {
    if (key === '$or') {
      return Array.isArray(expectedValue) && expectedValue.some((entry) => matchesFilter(document, entry));
    }

    return matchField(document[key], expectedValue);
  });
}

function applyUpdate(document, update) {
  if (!update || typeof update !== 'object') {
    return document;
  }

  if (Object.keys(update).some((key) => key.startsWith('$'))) {
    if (update.$unset && typeof update.$unset === 'object') {
      Object.keys(update.$unset).forEach((key) => {
        document[key] = undefined;
      });
    }

    if (update.$addToSet && typeof update.$addToSet === 'object') {
      Object.entries(update.$addToSet).forEach(([key, value]) => {
        const existing = Array.isArray(document[key]) ? [...document[key]] : [];
        if (!existing.map(String).includes(String(value))) {
          existing.push(value);
        }
        document[key] = existing;
      });
    }

    if (update.$pull && typeof update.$pull === 'object') {
      Object.entries(update.$pull).forEach(([key, value]) => {
        const existing = Array.isArray(document[key]) ? [...document[key]] : [];
        document[key] = existing.filter((entry) => String(entry) !== String(value));
      });
    }

    return document;
  }

  Object.assign(document, update);
  return document;
}

class QueryBuilder {
  constructor(Model, filter = {}, { single = false } = {}) {
    this.Model = Model;
    this.filter = filter;
    this.single = single;
    this.sortSpec = null;
    this.shouldLean = false;
  }

  sort(sortSpec = {}) {
    this.sortSpec = sortSpec;
    return this;
  }

  lean() {
    this.shouldLean = true;
    return this.exec();
  }

  async exec() {
    const documents = await this.Model._findMatching(this.filter);
    const sortedDocuments = this.sortSpec
      ? [...documents].sort((left, right) => {
          for (const [field, direction] of Object.entries(this.sortSpec)) {
            const result = compareValues(left[field], right[field], Number(direction));
            if (result !== 0) {
              return result;
            }
          }
          return 0;
        })
      : documents;

    const selected = this.single ? (sortedDocuments[0] || null) : sortedDocuments;

    if (this.shouldLean) {
      if (Array.isArray(selected)) {
        return selected.map((item) => ({ ...item }));
      }
      return selected ? { ...selected } : null;
    }

    if (Array.isArray(selected)) {
      return selected.map((item) => new this.Model(item));
    }
    return selected ? new this.Model(selected) : null;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

export default class BaseModel {
  constructor(attributes = {}) {
    Object.assign(this, this.constructor.applyDefaults(attributes));
    if (!this._id && this.id) {
      this._id = this.id;
    }
    if (!this.id && this._id) {
      this.id = this._id;
    }
  }

  static get tableName() {
    throw new Error('tableName must be defined on the model');
  }

  static get defaults() {
    return {};
  }

  static get columnMap() {
    return {};
  }

  static get timestampFields() {
    return ['createdAt', 'updatedAt', 'sessionExpiresAt', 'resetTokenExpiresAt', 'expiresAt'];
  }

  static applyDefaults(attributes = {}) {
    const defaults = typeof this.defaults === 'function' ? this.defaults() : this.defaults;
    const merged = {
      ...defaults,
      ...attributes,
    };

    if (merged.id && !merged._id) {
      merged._id = merged.id;
    }
    if (merged._id && !merged.id) {
      merged.id = merged._id;
    }

    return merged;
  }

  static getColumnName(property) {
    if (property === '_id' || property === 'id') {
      return 'id';
    }

    return this.columnMap[property] || camelToSnake(property);
  }

  static getPropertyName(column) {
    if (column === 'id') {
      return '_id';
    }

    const mappedEntry = Object.entries(this.columnMap).find(([, value]) => value === column);
    return mappedEntry ? mappedEntry[0] : snakeToCamel(column);
  }

  static fromRow(row = {}) {
    const document = {};

    Object.entries(row).forEach(([column, value]) => {
      const property = this.getPropertyName(column);
      document[property] = value;
    });

    if (document._id) {
      document.id = document._id;
    }

    return this.applyDefaults(document);
  }

  static toRow(document = {}) {
    const row = {};

    Object.entries(document).forEach(([property, value]) => {
      if (property === 'id') {
        return;
      }

      const column = this.getColumnName(property);
      row[column] = value;
    });

    return row;
  }

  toObject() {
    const plain = { ...this };
    if (plain._id && !plain.id) {
      plain.id = plain._id;
    }
    return plain;
  }

  async save() {
    await this.constructor.saveDocument(this);
    return this;
  }

  async deleteOne() {
    await this.constructor.deleteOne({ _id: this._id });
  }

  static async _selectAll() {
    await ensureSchema();
    const result = await query(`SELECT * FROM ${this.tableName}`);
    return result.rows.map((row) => this.fromRow(row));
  }

  static async _findMatching(filter = {}) {
    const documents = await this._selectAll();
    return documents.filter((document) => matchesFilter(document, filter));
  }

  static find(filter = {}, _projection = '') {
    return new QueryBuilder(this, filter, { single: false });
  }

  static findOne(filter = {}, _projection = '') {
    return new QueryBuilder(this, filter, { single: true });
  }

  static findById(id, _projection = '') {
    return new QueryBuilder(this, { _id: String(id) }, { single: true });
  }

  static async exists(filter = {}) {
    const document = await this.findOne(filter).lean();
    return !!document;
  }

  static async countDocuments(filter = {}) {
    const documents = await this._findMatching(filter);
    return documents.length;
  }

  static async create(attributes = {}) {
    const instance = new this({
      ...attributes,
      _id: attributes._id || attributes.id || crypto.randomUUID(),
    });

    await this.saveDocument(instance);
    return instance;
  }

  static async insertMany(items = []) {
    const inserted = [];
    for (const item of items) {
      inserted.push(await this.create(item));
    }
    return inserted;
  }

  static async saveDocument(instance) {
    await ensureSchema();

    const now = new Date();
    if (!instance._id) {
      instance._id = crypto.randomUUID();
    }
    instance.id = instance._id;

    if (!instance.createdAt) {
      instance.createdAt = now;
    }
    instance.updatedAt = now;

    const row = this.toRow(instance.toObject());
    const columns = Object.keys(row);
    const values = Object.values(row);
    const placeholders = columns.map((_, index) => `$${index + 1}`);
    const assignments = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = EXCLUDED.${column}`);

    await query(
      `INSERT INTO ${this.tableName} (${columns.join(', ')})
       VALUES (${placeholders.join(', ')})
       ON CONFLICT (id) DO UPDATE SET ${assignments.join(', ')}`,
      values
    );

    return instance;
  }

  static async updateOne(filter = {}, update = {}) {
    const document = await this.findOne(filter);
    if (!document) {
      return { matchedCount: 0, modifiedCount: 0 };
    }

    applyUpdate(document, update);
    await document.save();
    return { matchedCount: 1, modifiedCount: 1 };
  }

  static async updateMany(filter = {}, update = {}) {
    const documents = await this.find(filter);
    for (const document of documents) {
      applyUpdate(document, update);
      await document.save();
    }

    return { matchedCount: documents.length, modifiedCount: documents.length };
  }

  static async deleteOne(filter = {}) {
    const document = await this.findOne(filter);
    if (!document) {
      return { deletedCount: 0 };
    }

    await ensureSchema();
    await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [document._id]);
    return { deletedCount: 1 };
  }

  static async deleteMany(filter = {}) {
    const documents = await this.find(filter);
    for (const document of documents) {
      await query(`DELETE FROM ${this.tableName} WHERE id = $1`, [document._id]);
    }

    return { deletedCount: documents.length };
  }

  static async findByIdAndDelete(id) {
    const document = await this.findById(id);
    if (!document) {
      return null;
    }

    await this.deleteOne({ _id: document._id });
    return document;
  }

  static async findByIdAndUpdate(id, update = {}, options = {}) {
    const document = await this.findById(id);
    if (!document) {
      return null;
    }

    applyUpdate(document, update);
    await document.save();
    return options.new === false ? null : document;
  }

  static findOneAndUpdate(filter = {}, update = {}, options = {}) {
    const Model = this;

    const operation = async () => {
      let document = await Model.findOne(filter);

      if (!document && options.upsert) {
        const initialAttributes = {
          ...filter,
          ...(update.$set || {}),
        };

        if (!Object.keys(update).some((key) => key.startsWith('$'))) {
          Object.assign(initialAttributes, update);
        }

        document = new Model({
          ...initialAttributes,
          _id: initialAttributes._id || initialAttributes.id || crypto.randomUUID(),
        });
      }

      if (!document) {
        return null;
      }

      applyUpdate(document, update);
      await document.save();

      return document;
    };

    return {
      async lean() {
        const document = await operation();
        return document ? document.toObject() : null;
      },
      then(resolve, reject) {
        return operation().then(resolve, reject);
      },
    };
  }
}
