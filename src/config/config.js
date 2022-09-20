require('dotenv').config()

module.exports = {
    local: {
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        host: process.env.MYSQL_HOST,
        dialect: process.env.DB_CONNECTION,
    },
    development: {
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        host: process.env.MYSQL_HOST,
        dialect: process.env.DB_CONNECTION,
    },
    staging: {
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        host: process.env.MYSQL_HOST,
        dialect: process.env.DB_CONNECTION,
        logging: false,
    },
    pre_prod: {
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        host: process.env.MYSQL_HOST,
        dialect: process.env.DB_CONNECTION,
        logging: false,
    },
    production: {
        username: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        host: process.env.MYSQL_HOST,
        dialect: process.env.DB_CONNECTION,
        logging: false,
    },
}