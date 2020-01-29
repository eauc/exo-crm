const {
  getPersonIdBySiren,
  updatePerson,
  getOpenDealIdForPerson,
  updateDealStage,
} = require('../src/api.js');
const nock = require('nock');

describe('api', () => {
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('getPersonIdBySiren', () => {
    it('should get personId in API by custom field "SIREN"', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/persons')
            .query({
              field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
              value: '123456789',
            })
            .reply(200, {
              data: [
                { id: 'fakePersonId' },
              ],
            });

      const personId = await getPersonIdBySiren({
        userId: '#fakeUserId',
        siren: '123456789',
      });

      scope.done();
      expect(personId).toBe('fakePersonId');
    });

    it('should return no ID when person is not found', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/persons')
            .query({
              field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
              value: '123456789',
            })
            .reply(200, {
              data: [],
            });

      const personId = await getPersonIdBySiren({
        userId: '#fakeUserId',
        siren: '123456789',
      });

      scope.done();
      expect(personId).toBe(undefined);
    });
  });

  describe('updatePerson', () => {
    it('should update person by id in API', async () => {
      const scope = nock('http://api.crm.com/v1')
            .put('/persons/fakePersonId', {
              email: 'john.doe@example.com',
              phone: '0102030405',
              // SIREN
              '2d89a2a3c44faab761afe9043da4d40da3538adb': '123456789',
              // GeorgesUserID
              '8254d58243c8cf10f258ca054b7bc08582407491': '#fakeUserId',
              // JobLabel
              '1f2fa3f0c10305458b57ab0cdfeda1915802cfe2': 'nurse',
            })
            .reply(200);

      await updatePerson({
        personId: 'fakePersonId',
        data: {
          email: 'john.doe@example.com',
          phone: '0102030405',
          // SIREN
          '2d89a2a3c44faab761afe9043da4d40da3538adb': '123456789',
          // GeorgesUserID
          '8254d58243c8cf10f258ca054b7bc08582407491': '#fakeUserId',
          // JobLabel
          '1f2fa3f0c10305458b57ab0cdfeda1915802cfe2': 'nurse',
        },
      });

      scope.done();
    });
  });

  describe('getOpenDealIdForPerson', () => {
    it('should retrieve first open deal id for person in API', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/persons/fakePersonId/deals')
            .query({
              status: 'open',
            })
            .reply(200, {
              data: [
                { id: 'fakeDealId' },
              ],
            });

      const dealId = await getOpenDealIdForPerson({
        personId: 'fakePersonId',
      });

      scope.done();
      expect(dealId).toBe('fakeDealId');
    });

    it('should return no deal id when person has no open deal', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/persons/fakePersonId/deals')
            .query({
              status: 'open',
            })
            .reply(200, {
              data: [],
            });

      const dealId = await getOpenDealIdForPerson({
        personId: 'fakePersonId',
      });

      scope.done();
      expect(dealId).toBe(undefined);
    });
  });

  describe('updateDealStage', () => {
    it('should update deal stage_id in the correct pipeline (inbound)', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/deals/fakeDealId')
            .reply(200, {
              data: {
                id: 'fakeDealId',
                stage_id: 18,
              },
            })
            .put('/deals/fakeDealId', {
              stage_id: 19,
            })
            .reply(200);

      await updateDealStage({
        dealId: 'fakeDealId',
        stage: 'opportunities',
      });

      scope.done();
    });

    it('should update deal stage_id in the correct pipeline (outbound)', async () => {
      const scope = nock('http://api.crm.com/v1')
            .get('/deals/fakeDealId')
            .reply(200, {
              data: {
                id: 'fakeDealId',
                stage_id: 22,
              },
            })
            .put('/deals/fakeDealId', {
              stage_id: 24,
            })
            .reply(200);

      await updateDealStage({
        dealId: 'fakeDealId',
        stage: 'ongoing_trials',
      });

      scope.done();
    });
  });
});
