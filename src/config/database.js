const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
// Render PostgreSQL requires SSL even in development
const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isRenderDB) ? {
    rejectUnauthorized: false
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test connection
pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Connected to PostgreSQL database');
  }
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Helper function to execute queries
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function to get a client from the pool (for transactions)
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  client.query = (...args) => {
    client.lastQuery = args;
    return query(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release();
  };
  
  return client;
};

// Simple query builder for common operations
const db = {
  // SELECT queries
  from: (table) => ({
    select: (columns = '*') => ({
      eq: (column, value) => ({
        single: async () => {
          try {
            const result = await query(
              `SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
              [value]
            );
            return { data: result.rows[0] || null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        execute: async () => {
          try {
            const result = await query(
              `SELECT ${columns} FROM ${table} WHERE ${column} = $1`,
              [value]
            );
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      in: (column, values) => ({
        execute: async () => {
          try {
            const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
            const result = await query(
              `SELECT ${columns} FROM ${table} WHERE ${column} IN (${placeholders})`,
              values
            );
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      order: (column, options = {}) => ({
        execute: async () => {
          try {
            const direction = options.ascending ? 'ASC' : 'DESC';
            const result = await query(
              `SELECT ${columns} FROM ${table} ORDER BY ${column} ${direction}`
            );
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        limit: (limitValue) => ({
          execute: async () => {
            try {
              const direction = options.ascending ? 'ASC' : 'DESC';
              const result = await query(
                `SELECT ${columns} FROM ${table} ORDER BY ${column} ${direction} LIMIT $1`,
                [limitValue]
              );
              return { data: result.rows, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        })
      }),
      limit: (limitValue) => ({
        execute: async () => {
          try {
            const result = await query(
              `SELECT ${columns} FROM ${table} LIMIT $1`,
              [limitValue]
            );
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      execute: async () => {
        try {
          const result = await query(`SELECT ${columns} FROM ${table}`);
          return { data: result.rows, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }),
    
    // INSERT queries
    insert: (values) => ({
      select: () => ({
        single: async () => {
          try {
            const keys = Object.keys(values[0]);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
            const result = await query(
              `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`,
              Object.values(values[0])
            );
            return { data: result.rows[0], error: null };
          } catch (error) {
            return { data: null, error };
          }
        },
        execute: async () => {
          try {
            const keys = Object.keys(values[0]);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
            const result = await query(
              `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`,
              Object.values(values[0])
            );
            return { data: result.rows, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      execute: async () => {
        try {
          const keys = Object.keys(values[0]);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
          const result = await query(
            `INSERT INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
            Object.values(values[0])
          );
          return { data: null, error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    }),
    
    // UPDATE queries
    update: (values) => ({
      eq: (column, value) => ({
        select: () => ({
          single: async () => {
            try {
              const keys = Object.keys(values);
              const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
              const result = await query(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $${keys.length + 1} RETURNING *`,
                [...Object.values(values), value]
              );
              return { data: result.rows[0] || null, error: null };
            } catch (error) {
              return { data: null, error };
            }
          },
          execute: async () => {
            try {
              const keys = Object.keys(values);
              const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
              const result = await query(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $${keys.length + 1} RETURNING *`,
                [...Object.values(values), value]
              );
              return { data: result.rows, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        }),
        execute: async () => {
          try {
            const keys = Object.keys(values);
            const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(',');
            await query(
              `UPDATE ${table} SET ${setClause} WHERE ${column} = $${keys.length + 1}`,
              [...Object.values(values), value]
            );
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    
    // DELETE queries
    delete: () => ({
      eq: (column, value) => ({
        execute: async () => {
          try {
            await query(`DELETE FROM ${table} WHERE ${column} = $1`, [value]);
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      })
    }),
    
    // RPC (stored procedures)
    rpc: async (functionName, params) => {
      try {
        const keys = Object.keys(params);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
        const result = await query(
          `SELECT ${functionName}(${placeholders})`,
          Object.values(params)
        );
        return { data: result.rows[0], error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  })
};

// Export supabase as an alias for db for backward compatibility
const supabase = db;

module.exports = {
  pool,
  query,
  getClient,
  db,
  supabase
};
