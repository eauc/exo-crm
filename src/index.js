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
    const user = db.getUserById({ userId });
    const personId = api.getPersonIdBySiren({ siren });
    const dealId = api.getDealIdForPerson({ personId });
    const {
      updatePerson,
      updateDealStage,
    } = await pipedrive.updateUserInCRM({
      user, siren,
      personId, dealId,
    });
    await (updatePerson && api.updatePerson(updatePerson));
    await (updateDealStage && api.updateDealStage(updateDealStage));
  } finally {
    await db.close();
  }
}
