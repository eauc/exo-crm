const {
  getPersonIdBySirenQuery,
  getResourceIdResponse,
  updatePersonQuery,
  getOpenDealIdForPersonQuery,
  updateDealStageQuery,
} = require('../src/api.js');

describe('api', () => {
  describe('getPersonIdBySirenQuery', () => {
    it('should get personId in API by custom field "SIREN"', () => {
      expect(getPersonIdBySirenQuery({
        userId: '#fakeUserId',
        siren: '123456789',
      })).toEqual({
        method: 'GET',
        url: 'http://api.crm.com/v1/persons',
        params: {
          // SIREN key
          field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
          value: '123456789',
        },
      });
    });
  });

  describe('getResourceIdResponse', () => {
    it('should return no ID when resource is not found', () => {
      const resourceId = getResourceIdResponse({
        data: { data: [] },
      });

      expect(resourceId).toBe(undefined);
    });

    it('should return no ID when resource is not found', () => {
      const resourceId = getResourceIdResponse({
        data: { data: [{ id: 'fakeResourceId' }] },
      });

      expect(resourceId).toBe('fakeResourceId');
    });
  });

  describe('updatePersonQuery', () => {
    it('should update person by id in API', () => {
      expect(updatePersonQuery({
        personId: 'fakePersonId',
        data: {
          email: 'john.doe@example.com',
          phone: '0102030405',
          siren: '123456789',
          georgesUserId: '#fakeUserId',
          jobLabel: 'nurse',
        },
      })).toEqual({
        method: 'PUT',
        url: 'http://api.crm.com/v1/persons/fakePersonId',
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
    });
  });

  describe('getOpenDealIdForPersonQuery', () => {
    it('should retrieve open deal ids for person in API', () => {
      expect(getOpenDealIdForPersonQuery({
        personId: 'fakePersonId',
      })).toEqual({
        method: 'GET',
        url: 'http://api.crm.com/v1/persons/fakePersonId/deals',
        params: {
          status: 'open',
        },
      });
    });
  });

  describe('updateDealStageQuery', () => {
    it('should update deal stage_id in the correct pipeline (inbound)', () => {
      expect(updateDealStageQuery({
        deal: {
          id: 'fakeDealId',
          stage_id: 18,
        },
        stage: 'opportunities',
      })).toEqual({
        method: 'PUT',
        url: 'http://api.crm.com/v1/deals/fakeDealId',
        data: {
          stage_id: 19,
        },
      });
    });

    it('should update deal stage_id in the correct pipeline (outbound)', () => {
      expect(updateDealStageQuery({
        deal: {
          id: 'fakeDealId',
          stage_id: 22,
        },
        stage: 'ongoing_trials',
      })).toEqual({
        method: 'PUT',
        url: 'http://api.crm.com/v1/deals/fakeDealId',
        data: {
          stage_id: 24,
        },
      });
    });
  });
});
