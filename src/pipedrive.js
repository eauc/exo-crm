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
        // SIREN
        '2d89a2a3c44faab761afe9043da4d40da3538adb': siren,
        // GeorgesUserID
        '8254d58243c8cf10f258ca054b7bc08582407491': userId,
        // JobLabel
        '1f2fa3f0c10305458b57ab0cdfeda1915802cfe2': user.job,
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
