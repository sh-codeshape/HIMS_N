import { Pool } from 'pg';
import { config } from './index';
import { logger } from './logger';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

pool.on('error', (err: Error) => {
  logger.error({ err }, 'Unexpected error on idle client');
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug({ query: text, params, duration, rows: res.rowCount }, 'Executed query');
  return res;
};

// Use this for transactions
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  // @ts-ignore
  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
    logger.error(`The last executed query on this client was: ${(client as any).lastQuery}`);
  }, 5000);

  // @ts-ignore
  client.query = (...args: any) => {
    // @ts-ignore
    client.lastQuery = args;
    return query.apply(client, args);
  };
  
  client.release = () => {
    clearTimeout(timeout);
    // @ts-ignore
    client.query = query;
    // @ts-ignore
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

export const db = {
  query,
  getClient,
  connect: pool.connect.bind(pool),
};

export default db;
