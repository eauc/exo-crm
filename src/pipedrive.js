const _ = require('lodash');
const { MongoClient } = require('mongodb');

const {
  getDB,
} = require('./db');
const {
  getPersonIdBySiren,
  updatePerson,
  getOpenDealIdForPerson,
  updateDealStage,
} = require('./api');

module.exports = {
  updateUserInCRM,
};

async function updateUserInCRM({ userId, siren }) {
  const db = await getDB({
    url: 'mongodb://localhost:27017',
    dbName: 'test',
  });
  try {
    const user = await db.getUserById({ userId });
    if (!user) {
      console.log('No user found');
      return;
    }

    const personId = await getPersonIdBySiren({ siren });
    if (!personId) {
      console.log('No person found');
      return;
    }

    await updatePerson({
      personId,
      data: {
        email: user.email,
        phone: user.phone,
        siren,
        georgesUserId: userId,
        jobLabel: user.job,
      },
    });

    if (user.isSubscribed) {
      console.log('User already subscribed');
      return;
    }

    const dealId = await getOpenDealIdForPerson({ personId });
    if (!dealId) {
      console.log('No deal found');
      return;
    }

    const stage = user.hasSynchronizedBankAccount ? 'ongoing_trials' : 'opportunities';
    await updateDealStage({
      dealId,
      stage,
    });
  } finally {
    await db.close();
  }
}
