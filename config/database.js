const { Pool } = require('pg');

// Create PostgreSQL connection pool
// Support both DATABASE_URL (Render/Heroku) and individual params (local)
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_NAME || 'steelmelt_erp',
        user: process.env.DB_USER || 'steelmelt_user',
        password: String(process.env.DB_PASSWORD || 'steelmelt_password_2024'),
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }
);

// Test database connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  // Don't exit - just log the error
  // process.exit(-1);
});

/**
 * Execute a SQL query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise} Query result
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise} Database client
 */
const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Set a timeout of 5 seconds, after which we will log this client's last query
  const timeout = setTimeout(() => {
    console.error('A client has been checked out for more than 5 seconds!');
  }, 5000);
  
  // Monkey patch the query method to keep track of the last query executed
  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

/**
 * Execute a transaction
 * @param {Function} callback - Callback function containing transaction logic
 * @returns {Promise} Transaction result
 */
const transaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Build WHERE clause from filters object
 * @param {Object} filters - Filter object
 * @param {number} startIndex - Starting parameter index
 * @returns {Object} { clause, params, nextIndex }
 */
const buildWhereClause = (filters, startIndex = 1) => {
  const conditions = [];
  const params = [];
  let paramIndex = startIndex;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string' && value.includes('%')) {
        conditions.push(`${key} ILIKE $${paramIndex}`);
        params.push(value);
      } else {
        conditions.push(`${key} = $${paramIndex}`);
        params.push(value);
      }
      paramIndex++;
    }
  });

  const clause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  return { clause, params, nextIndex: paramIndex };
};

/**
 * Generic CRUD operations helper
 */
const crud = {
  /**
   * Create a new record
   * @param {string} table - Table name
   * @param {Object} data - Data to insert
   * @returns {Promise} Created record
   */
  create: async (table, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    
    const text = `
      INSERT INTO ${table} (${keys.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await query(text, values);
    return result.rows[0];
  },

  /**
   * Find records with optional filters
   * @param {string} table - Table name
   * @param {Object} filters - Filter object
   * @param {Object} options - Additional options (orderBy, limit, offset)
   * @returns {Promise} Array of records
   */
  findAll: async (table, filters = {}, options = {}) => {
    const { clause, params } = buildWhereClause(filters);
    
    let text = `SELECT * FROM ${table} ${clause}`;
    
    if (options.orderBy) {
      text += ` ORDER BY ${options.orderBy}`;
    }
    
    if (options.limit) {
      text += ` LIMIT ${options.limit}`;
    }
    
    if (options.offset) {
      text += ` OFFSET ${options.offset}`;
    }
    
    const result = await query(text, params);
    return result.rows;
  },

  /**
   * Find a single record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {Promise} Record or null
   */
  findById: async (table, id) => {
    const text = `SELECT * FROM ${table} WHERE id = $1`;
    const result = await query(text, [id]);
    return result.rows[0] || null;
  },

  /**
   * Update a record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @param {Object} data - Data to update
   * @returns {Promise} Updated record
   */
  update: async (table, id, data) => {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const text = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(text, [id, ...values]);
    return result.rows[0];
  },

  /**
   * Delete a record by ID
   * @param {string} table - Table name
   * @param {number} id - Record ID
   * @returns {Promise} Deleted record
   */
  delete: async (table, id) => {
    const text = `DELETE FROM ${table} WHERE id = $1 RETURNING *`;
    const result = await query(text, [id]);
    return result.rows[0];
  }
};

module.exports = {
  query,
  getClient,
  transaction,
  buildWhereClause,
  crud,
  pool
};
