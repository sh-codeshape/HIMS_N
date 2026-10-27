"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.getClient = exports.query = exports.pool = void 0;
const pg_1 = require("pg");
const index_1 = require("./index");
const logger_1 = require("./logger");
exports.pool = new pg_1.Pool({
    connectionString: index_1.config.databaseUrl,
});
exports.pool.on('error', (err) => {
    logger_1.logger.error({ err }, 'Unexpected error on idle client');
    process.exit(-1);
});
// Try to parse the database URL to log where we are connecting (hiding the password)
try {
    const dbUrl = new URL(index_1.config.databaseUrl);
    logger_1.logger.info(`Database connection configured for host: ${dbUrl.hostname}, database: ${dbUrl.pathname.replace('/', '')}`);
}
catch (e) {
    logger_1.logger.warn('Could not parse database URL for logging.');
}
const query = async (text, params) => {
    const start = Date.now();
    const res = await exports.pool.query(text, params);
    const duration = Date.now() - start;
    logger_1.logger.debug({ query: text, params, duration, rows: res.rowCount }, 'Executed query');
    return res;
};
exports.query = query;
// Use this for transactions
const getClient = async () => {
    const client = await exports.pool.connect();
    const query = client.query;
    const release = client.release;
    // @ts-ignore
    const timeout = setTimeout(() => {
        logger_1.logger.error('A client has been checked out for more than 5 seconds!');
        logger_1.logger.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);
    // @ts-ignore
    client.query = (...args) => {
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
exports.getClient = getClient;
exports.db = {
    query: exports.query,
    getClient: exports.getClient,
    connect: exports.pool.connect.bind(exports.pool),
};
exports.default = exports.db;
