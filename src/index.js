const _ = require('lodash');

const {
  getDB,
} = require('./db');
const api = require('./api');
const pipedrive = require('pipedrive');

module.exports = {
  updateUserInCRM,
};

async function updateUserInCRM({ userId, siren }) {
  const db = await getDB({
    url: 'mongodb://localhost:27017',
    dbName: 'test',
  });
  try {
    await pipedrive.updateUserInCRM({
      userId, siren,
      db, api,
    });
  } finally {
    await db.close();
  }
}
