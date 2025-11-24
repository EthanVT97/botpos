// PostgreSQL compatibility layer for Supabase API
// This file provides a Supabase-compatible interface using native PostgreSQL
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
});

// Helper to build Supabase-compatible response
const buildResponse = (data, error = null) => ({
  data: error ? null : data,
  error: error ? { message: error.message, details: error } : null
});

// Supabase-compatible query builder
class QueryBuilder {
  constructor(table) {
    this.table = table;
    this.selectColumns = '*';
    this.whereConditions = [];
    this.whereValues = [];
    this.orderByClause = '';
    this.limitValue = null;
    this.singleResult = false;
  }

  select(columns = '*') {
    // Handle Supabase-style nested selects like "*, categories(name)"
    if (columns.includes('(')) {
      this.selectColumns = this.parseNestedSelect(columns);
    } else {
      this.selectColumns = columns;
    }
    return this;
  }

  parseNestedSelect(columns) {
    // Convert "*, categories(name)" to proper SQL with JOIN
    // This is a simplified parser for common cases
    const parts = columns.split(',').map(p => p.trim());
    const regularColumns = [];
    const joins = [];

    parts.forEach(part => {
      if (part.includes('(')) {
        // Extract table and columns: "categories(name)"
        const match = part.match(/(\w+)\(([^)]+)\)/);
        if (match) {
          const [, joinTable, joinColumns] = match;
          joins.push({ table: joinTable, columns: joinColumns });
        }
      } else {
        regularColumns.push(part);
      }
    });

    this.joins = joins;
    return regularColumns.join(', ');
  }

  eq(column, value) {
    this.whereConditions.push(`${column} = $${this.whereValues.length + 1}`);
    this.whereValues.push(value);
    return this;
  }

  in(column, values) {
    const placeholders = values.map((_, i) => `$${this.whereValues.length + i + 1}`).join(',');
    this.whereConditions.push(`${column} IN (${placeholders})`);
    this.whereValues.push(...values);
    return this;
  }

  or(condition) {
    // Simple OR implementation for basic queries
    this.whereConditions.push(`(${condition})`);
    return this;
  }

  order(column, options = {}) {
    const direction = options.ascending ? 'ASC' : 'DESC';
    this.orderByClause = ` ORDER BY ${column} ${direction}`;
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  single() {
    this.singleResult = true;
    this.limitValue = 1;
    return this;
  }

  async execute() {
    try {
      let selectClause = this.selectColumns;
      let fromClause = `${this.table}`;
      let joinClauses = '';
      
      // Handle JOINs if present
      if (this.joins && this.joins.length > 0) {
        // Build JOIN clauses
        this.joins.forEach(join => {
          const joinCols = join.columns.split(',').map(col => 
            `${join.table}.${col.trim()} as ${join.table}_${col.trim()}`
          ).join(', ');
          
          if (selectClause === '*') {
            selectClause = `${this.table}.*`;
          }
          selectClause += `, ${joinCols}`;
          
          // Determine foreign key column name (e.g., category_id for categories table)
          // Handle both regular and irregular plurals
          let fkColumn;
          if (join.table.endsWith('ies')) {
            // categories -> category_id
            fkColumn = `${join.table.slice(0, -3)}y_id`;
          } else if (join.table.endsWith('s')) {
            // products -> product_id, customers -> customer_id
            fkColumn = `${join.table.slice(0, -1)}_id`;
          } else {
            fkColumn = `${join.table}_id`;
          }
          joinClauses += ` LEFT JOIN ${join.table} ON ${this.table}.${fkColumn} = ${join.table}.id`;
        });
      }
      
      let query = `SELECT ${selectClause} FROM ${fromClause}${joinClauses}`;
      
      if (this.whereConditions.length > 0) {
        query += ` WHERE ${this.whereConditions.join(' AND ')}`;
      }
      
      query += this.orderByClause;
      
      if (this.limitValue) {
        query += ` LIMIT ${this.limitValue}`;
      }

      const result = await pool.query(query, this.whereValues);
      
      // Transform result to match Supabase structure
      const transformedRows = result.rows.map(row => {
        const transformed = {};
        const nested = {};
        
        Object.keys(row).forEach(key => {
          if (key.includes('_') && this.joins) {
            const parts = key.split('_');
            const possibleTable = parts[0];
            
            if (this.joins.some(j => j.table === possibleTable)) {
              if (!nested[possibleTable]) nested[possibleTable] = {};
              nested[possibleTable][parts.slice(1).join('_')] = row[key];
            } else {
              transformed[key] = row[key];
            }
          } else {
            transformed[key] = row[key];
          }
        });
        
        return { ...transformed, ...nested };
      });
      
      if (this.singleResult) {
        return buildResponse(transformedRows[0] || null);
      }
      
      return buildResponse(transformedRows);
    } catch (error) {
      console.error('Query error:', error);
      return buildResponse(null, error);
    }
  }

  // Alias for execute() to match Supabase API
  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

// Insert builder
class InsertBuilder {
  constructor(table, values) {
    this.table = table;
    this.values = Array.isArray(values) ? values : [values];
    this.shouldSelect = false;
    this.singleResult = false;
  }

  select() {
    this.shouldSelect = true;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      const keys = Object.keys(this.values[0]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const query = `INSERT INTO ${this.table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await pool.query(query, Object.values(this.values[0]));
      
      if (this.singleResult || this.values.length === 1) {
        return buildResponse(result.rows[0]);
      }
      
      return buildResponse(result.rows);
    } catch (error) {
      console.error('Insert error:', error);
      return buildResponse(null, error);
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

// Update builder
class UpdateBuilder {
  constructor(table, values) {
    this.table = table;
    this.values = values;
    this.whereConditions = [];
    this.whereValues = [];
    this.shouldSelect = false;
    this.singleResult = false;
  }

  eq(column, value) {
    this.whereConditions.push(`${column} = $${Object.keys(this.values).length + this.whereValues.length + 1}`);
    this.whereValues.push(value);
    return this;
  }

  select() {
    this.shouldSelect = true;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  async execute() {
    try {
      const keys = Object.keys(this.values);
      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
      let query = `UPDATE ${this.table} SET ${setClause}`;
      
      if (this.whereConditions.length > 0) {
        query += ` WHERE ${this.whereConditions.join(' AND ')}`;
      }
      
      if (this.shouldSelect) {
        query += ' RETURNING *';
      }

      const result = await pool.query(query, [...Object.values(this.values), ...this.whereValues]);
      
      if (this.singleResult) {
        return buildResponse(result.rows[0] || null);
      }
      
      return buildResponse(this.shouldSelect ? result.rows : null);
    } catch (error) {
      console.error('Update error:', error);
      return buildResponse(null, error);
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

// Delete builder
class DeleteBuilder {
  constructor(table) {
    this.table = table;
    this.whereConditions = [];
    this.whereValues = [];
  }

  eq(column, value) {
    this.whereConditions.push(`${column} = $${this.whereValues.length + 1}`);
    this.whereValues.push(value);
    return this;
  }

  async execute() {
    try {
      let query = `DELETE FROM ${this.table}`;
      
      if (this.whereConditions.length > 0) {
        query += ` WHERE ${this.whereConditions.join(' AND ')}`;
      }

      await pool.query(query, this.whereValues);
      return buildResponse(null);
    } catch (error) {
      console.error('Delete error:', error);
      return buildResponse(null, error);
    }
  }

  then(resolve, reject) {
    return this.execute().then(resolve, reject);
  }
}

// Main Supabase-compatible client
const supabase = {
  from: (table) => ({
    select: (columns) => new QueryBuilder(table).select(columns),
    insert: (values) => new InsertBuilder(table, values),
    update: (values) => new UpdateBuilder(table, values),
    delete: () => new DeleteBuilder(table),
    upsert: async (values, options = {}) => {
      try {
        const keys = Object.keys(values);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
        const conflictColumn = options.onConflict || 'id';
        const updateSet = keys.filter(k => k !== conflictColumn).map(k => `${k} = EXCLUDED.${k}`).join(',');
        
        const query = `
          INSERT INTO ${table} (${keys.join(',')}) 
          VALUES (${placeholders})
          ON CONFLICT (${conflictColumn}) 
          DO UPDATE SET ${updateSet}
          RETURNING *
        `;
        
        const result = await pool.query(query, Object.values(values));
        return buildResponse(result.rows[0]);
      } catch (error) {
        console.error('Upsert error:', error);
        return buildResponse(null, error);
      }
    }
  }),
  
  rpc: async (functionName, params = {}) => {
    try {
      const keys = Object.keys(params);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
      const query = `SELECT ${functionName}(${placeholders})`;
      
      const result = await pool.query(query, Object.values(params));
      return buildResponse(result.rows[0]);
    } catch (error) {
      console.error('RPC error:', error);
      return buildResponse(null, error);
    }
  }
};

// Admin client (same as regular client for now)
const supabaseAdmin = supabase;

module.exports = { supabase, supabaseAdmin, pool };
