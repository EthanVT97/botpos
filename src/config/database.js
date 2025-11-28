const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool
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
  const originalQuery = client.query.bind(client);
  const originalRelease = client.release.bind(client);
  
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = originalQuery;
    client.release = originalRelease;
    return originalRelease();
  };
  
  return client;
};

// Whitelist of allowed tables and columns for SQL injection prevention
const ALLOWED_TABLES = [
  'products', 'orders', 'customers', 'users', 'categories', 
  'order_items', 'inventory_movements', 'settings', 'roles',
  'chat_messages', 'chat_sessions', 'stores', 'store_transfers',
  'uom', 'product_uom', 'selling_prices', 'bot_flows'
];

const ALLOWED_COLUMNS = {
  products: ['id', 'name', 'name_mm', 'description', 'price', 'cost', 'category_id', 'sku', 'barcode', 'stock_quantity', 'image_url', 'base_uom_id', 'created_at', 'updated_at'],
  orders: ['id', 'customer_id', 'store_id', 'total_amount', 'discount', 'tax', 'payment_method', 'status', 'notes', 'source', 'created_at', 'updated_at'],
  customers: ['id', 'name', 'phone', 'email', 'address', 'viber_id', 'telegram_id', 'messenger_id', 'created_at', 'updated_at'],
  users: ['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'updated_at'],
  categories: ['id', 'name', 'name_mm', 'description', 'created_at', 'updated_at'],
};

// Validate identifier (table or column name)
const validateIdentifier = (identifier, type = 'identifier') => {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
    throw new Error(`Invalid ${type}: ${identifier}`);
  }
  return identifier;
};

// Validate table name against whitelist
const validateTable = (table) => {
  const validTable = validateIdentifier(table, 'table');
  if (!ALLOWED_TABLES.includes(validTable)) {
    throw new Error(`Table not allowed: ${table}`);
  }
  return validTable;
};

// Validate column name
const validateColumn = (column, table = null) => {
  const validColumn = validateIdentifier(column, 'column');
  
  // If table is specified, check against allowed columns
  if (table && ALLOWED_COLUMNS[table]) {
    if (!ALLOWED_COLUMNS[table].includes(validColumn)) {
      throw new Error(`Column not allowed for table ${table}: ${column}`);
    }
  }
  
  return validColumn;
};

// Simple query builder with SQL injection protection
const db = {
  from: (table) => {
    const validTable = validateTable(table);
    
    return {
      select: (columns = '*') => {
        const validColumns = columns === '*' ? '*' : 
          columns.split(',').map(c => validateColumn(c.trim(), validTable)).join(', ');
        
        return {
          eq: (column, value) => {
            const validColumn = validateColumn(column, validTable);
            
            return {
              single: async () => {
                try {
                  const result = await query(
                    `SELECT ${validColumns} FROM ${validTable} WHERE ${validColumn} = $1 LIMIT 1`,
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
                    `SELECT ${validColumns} FROM ${validTable} WHERE ${validColumn} = $1`,
                    [value]
                  );
                  return { data: result.rows, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              }
            };
          },
          
          in: (column, values) => {
            const validColumn = validateColumn(column, validTable);
            
            return {
              execute: async () => {
                try {
                  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
                  const result = await query(
                    `SELECT ${validColumns} FROM ${validTable} WHERE ${validColumn} IN (${placeholders})`,
                    values
                  );
                  return { data: result.rows, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              }
            };
          },
          
          order: (column, options = {}) => {
            const validColumn = validateColumn(column, validTable);
            const direction = options.ascending ? 'ASC' : 'DESC';
            
            return {
              execute: async () => {
                try {
                  const result = await query(
                    `SELECT ${validColumns} FROM ${validTable} ORDER BY ${validColumn} ${direction}`
                  );
                  return { data: result.rows, error: null };
                } catch (error) {
                  return { data: null, error };
                }
              },
              limit: (limitValue) => ({
                execute: async () => {
                  try {
                    const result = await query(
                      `SELECT ${validColumns} FROM ${validTable} ORDER BY ${validColumn} ${direction} LIMIT $1`,
                      [limitValue]
                    );
                    return { data: result.rows, error: null };
                  } catch (error) {
                    return { data: null, error };
                  }
                }
              })
            };
          },
          
          limit: (limitValue) => ({
            execute: async () => {
              try {
                const result = await query(
                  `SELECT ${validColumns} FROM ${validTable} LIMIT $1`,
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
              const result = await query(`SELECT ${validColumns} FROM ${validTable}`);
              return { data: result.rows, error: null };
            } catch (error) {
              return { data: null, error };
            }
          }
        };
      },
      
      insert: (values) => ({
        select: () => ({
          single: async () => {
            try {
              const keys = Object.keys(values[0]);
              keys.forEach(k => validateColumn(k, validTable));
              const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
              const result = await query(
                `INSERT INTO ${validTable} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
              keys.forEach(k => validateColumn(k, validTable));
              const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
              const result = await query(
                `INSERT INTO ${validTable} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
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
            keys.forEach(k => validateColumn(k, validTable));
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const result = await query(
              `INSERT INTO ${validTable} (${keys.join(', ')}) VALUES (${placeholders})`,
              Object.values(values[0])
            );
            return { data: null, error: null };
          } catch (error) {
            return { data: null, error };
          }
        }
      }),
      
      update: (values) => ({
        eq: (column, value) => {
          const validColumn = validateColumn(column, validTable);
          
          return {
            select: () => ({
              single: async () => {
                try {
                  const keys = Object.keys(values);
                  keys.forEach(k => validateColumn(k, validTable));
                  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
                  const result = await query(
                    `UPDATE ${validTable} SET ${setClause} WHERE ${validColumn} = $${keys.length + 1} RETURNING *`,
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
                  keys.forEach(k => validateColumn(k, validTable));
                  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
                  const result = await query(
                    `UPDATE ${validTable} SET ${setClause} WHERE ${validColumn} = $${keys.length + 1} RETURNING *`,
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
                keys.forEach(k => validateColumn(k, validTable));
                const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
                await query(
                  `UPDATE ${validTable} SET ${setClause} WHERE ${validColumn} = $${keys.length + 1}`,
                  [...Object.values(values), value]
                );
                return { data: null, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          };
        }
      }),
      
      delete: () => ({
        eq: (column, value) => {
          const validColumn = validateColumn(column, validTable);
          
          return {
            execute: async () => {
              try {
                await query(`DELETE FROM ${validTable} WHERE ${validColumn} = $1`, [value]);
                return { data: null, error: null };
              } catch (error) {
                return { data: null, error };
              }
            }
          };
        }
      }),
      
      rpc: async (functionName, params) => {
        try {
          const keys = Object.keys(params);
          const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
          const result = await query(
            `SELECT ${functionName}(${placeholders})`,
            Object.values(params)
          );
          return { data: result.rows[0], error: null };
        } catch (error) {
          return { data: null, error };
        }
      }
    };
  }
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
