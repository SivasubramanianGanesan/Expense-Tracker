
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '../config/config.json'))[env];
const db = {};

let sequelize;

if (!config) {
  throw new Error(`Database configuration not found for environment: ${env}`);
}

if (env === 'production') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing from environment variables');
  }

  const { use_env_variable, ...sequelizeOptions } = config;
  sequelize = new Sequelize(process.env.DATABASE_URL, sequelizeOptions);
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || config.database,
    process.env.DB_USER || config.username,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || config.host || 'localhost',
      port: Number(process.env.DB_PORT || config.port || 5432),
      dialect: config.dialect,
      logging: config.logging === false ? false : console.log
    }
  );
}

fs.readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== basename &&
    file.slice(-3) === '.js' &&
    !file.endsWith('.test.js')
  )

.forEach(file => {
  const modelPath = path.join(__dirname, file);
  const modelFactory = require(modelPath);

  if (typeof modelFactory !== 'function') {
    throw new Error(
      `Invalid Sequelize model export in ${file}. Expected a function, received ${typeof modelFactory}.`
    );
  }

  const model = modelFactory(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
});


Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
