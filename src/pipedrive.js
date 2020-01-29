const _ = require('lodash');
const axios = require('axios');
const { MongoClient } = require('mongodb');

const {
  getDB,
} = require('./db');

module.exports = {
  updateUserInCRM,
};

const pipelines = {
  inbound: {
    identified_leads: 18,
    opportunities: 19,
    ongoing_trials: 20,
    subscriptions: 21,
  },
  outbound: {
    identified_leads: 22,
    opportunities: 23,
    ongoing_trials: 24,
    subscriptions: 25,
  },
};

const stageIDs = _(pipelines)
  .flatMap((stages, pipeline) => {
    return _.map(stages, (stageId, stage) => [
      stageId, { pipeline, stage },
    ]);
  })
  .fromPairs()
  .value();

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

    const { data: { data: personIds } } = await axios({
      method: 'GET',
      url: 'http://api.crm.com/v1/persons',
      params: {
        // SIREN key
        field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
        value: siren,
      },
    });

    if (_.isEmpty(personIds)) {
      console.log('No person found');
      return;
    }

    const { id: personId } = _.first(personIds);
    await axios({
      method: 'PUT',
      url: `http://api.crm.com/v1/persons/${personId}`,
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

    const { data: { data: dealIds } } = await axios({
      method: 'GET',
      url: `http://api.crm.com/v1/persons/${personId}/deals`,
      params: {
        status: 'open',
      },
    });
    if (_.isEmpty(dealIds)) {
      console.log('No deal found');
      return;
    }

    const { id: dealId } = _.first(dealIds);
    const { data: { data: deal } } = await axios({
      method: 'GET',
      url: `http://api.crm.com/v1/deals/${dealId}`,
    });

    const {
      pipeline,
    } = _.get(stageIDs, deal.stage_id);
    const stage = user.hasSynchronizedBankAccount ? 'ongoing_trials' : 'opportunities';

    await axios({
      method: 'PUT',
      url: `http://api.crm.com/v1/deals/${dealId}`,
      data: {
        stage_id: pipelines[pipeline][stage],
      },
    });
  } finally {
    await db.close();
  }
}
