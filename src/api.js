const _ = require('lodash');
const axios = require('axios');

module.exports = {
  getPersonIdBySiren,
  updatePerson,
  getOpenDealIdForPerson,
  updateDealStage,
  // transformers,
  getResourceIdResponse,
  getPersonIdBySirenQuery,
  updatePersonQuery,
  getOpenDealIdForPersonQuery,
  updateDealStageQuery,
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

const personFields = {
  siren: '2d89a2a3c44faab761afe9043da4d40da3538adb',
  georgesUserId: '8254d58243c8cf10f258ca054b7bc08582407491',
  jobLabel: '1f2fa3f0c10305458b57ab0cdfeda1915802cfe2',
};

async function getPersonIdBySiren({ siren }) {
  const response = await axios(getPersonIdBySirenQuery({ siren }));
  return getResourceIdResponse(response);
}

async function updatePerson({ personId, data }) {
  await axios(updatePersonQuery({ personId, data }));
}

async function getOpenDealIdForPerson({ personId }) {
  const response = await axios(getOpenDealIdForPersonQuery({ personId }));
  return getResourceIdResponse(response);
}

async function updateDealStage({ dealId, stage }) {
  const deal = getDealResponse(await axios(getDealQuery({ dealId })));
  await axios(updateDealStageQuery({ deal, stage }));
}

function getPersonIdBySirenQuery({ siren }) {
  return {
    method: 'GET',
    url: 'http://api.crm.com/v1/persons',
    params: {
      // SIREN key
      field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
      value: siren,
    },
  };
}

function getResourceIdResponse({ data: { data: resourceIds } }) {
  if (_.isEmpty(resourceIds)) {
    return undefined;
  }

  const { id: resourceId } = _.first(resourceIds);
  return resourceId;
}

function updatePersonQuery({ personId, data }) {
  const apiPersonData = pipedrivePersonToApiPerson({ person: data });
  return {
    method: 'PUT',
    url: `http://api.crm.com/v1/persons/${personId}`,
    data: apiPersonData,
  };
};

function pipedrivePersonToApiPerson({ person }) {
  return _.mapKeys(person, (value, key) => {
    return _.get(personFields, key, key);
  });
}

function getOpenDealIdForPersonQuery({ personId }) {
  return {
    method: 'GET',
    url: `http://api.crm.com/v1/persons/${personId}/deals`,
    params: {
      status: 'open',
    },
  };
}

function getDealQuery({ dealId }) {
  return {
    method: 'GET',
    url: `http://api.crm.com/v1/deals/${dealId}`,
  };
}

function getDealResponse({ data: { data: deal } }) {
  return deal;
}

function updateDealStageQuery({ deal, stage }) {
  const {
    pipeline,
  } = _.get(stageIDs, deal.stage_id);

  return {
    method: 'PUT',
    url: `http://api.crm.com/v1/deals/${deal.id}`,
    data: {
      stage_id: pipelines[pipeline][stage],
    },
  };
}

function stageIdToPipeline({ stageId }) {
  const {
    pipeline,
  } = _.get(stageIDs, stageId);
  return pipeline;
}

function pipelineStageToStageId({ pipeline, stage }) {
  return pipelines[pipeline][stage];
}
