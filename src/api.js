const _ = require('lodash');
const axios = require('axios');

module.exports = {
  getPersonIdBySiren,
  updatePerson,
  getOpenDealIdForPerson,
  updateDealStage,
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

async function getPersonIdBySiren({ siren }) {
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
    return undefined;
  }

  const { id: personId } = _.first(personIds);
  return personId;
}

async function updatePerson({ personId, data }) {
  await axios({
    method: 'PUT',
    url: `http://api.crm.com/v1/persons/${personId}`,
    data: data
  });
}

async function getOpenDealIdForPerson({ personId }) {
    const { data: { data: dealIds } } = await axios({
      method: 'GET',
      url: `http://api.crm.com/v1/persons/${personId}/deals`,
      params: {
        status: 'open',
      },
    });
    if (_.isEmpty(dealIds)) {
      return undefined;
    }

  const { id: dealId } = _.first(dealIds);
  return dealId;
}

async function updateDealStage({ dealId, stage }) {
  const { data: { data: deal } } = await axios({
    method: 'GET',
    url: `http://api.crm.com/v1/deals/${dealId}`,
  });

  const {
    pipeline,
  } = _.get(stageIDs, deal.stage_id);

  await axios({
    method: 'PUT',
    url: `http://api.crm.com/v1/deals/${dealId}`,
    data: {
      stage_id: pipelines[pipeline][stage],
    },
  });
}