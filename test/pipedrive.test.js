const { updateUserInCRM } = require('../src/pipedrive.js');
const dbModule = require('../src/db.js');
const nock = require('nock');

jest.mock('../src/db.js');

describe('pipedrive', () => {
  let mockDB;
  beforeEach(() => {
    mockDB = {
      getUserById: jest.fn(),
      countUserBankAccounts: jest.fn(),
      close: jest.fn(),
    };
    dbModule.getDB.mockResolvedValue(mockDB);
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should do nothing when user is not found', async () => {
    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });
  });

  it('should do nothing when person with SIREN is not found', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      emails: [{
        address: 'john.doe@example.com',
      }],
      profile: {
        phone: '0102030405',
        job: 'nurse',
      },
      stripe: {},
    });
    const scope = nock('http://api.crm.com/v1')
      .get('/persons')
      .query({
        field: '2d89a2a3c44faab761afe9043da4d40da3538adb',
        value: '123456789',
      })
      .reply(200, {
        data: [],
      });

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    scope.done();
    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
  });

  it('should update person with SIREN and not update deal when user is already subscribed', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      emails: [{
        address: 'john.doe@example.com',
      }],
      profile: {
        phone: '0102030405',
        job: 'nurse',
      },
      stripe: { plan: 'normal24' },
    });
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
      })
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

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    scope.done();
    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
  });

  it('should update person with SIREN then stop when open deal is not found', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      emails: [{
        address: 'john.doe@example.com',
      }],
      profile: {
        phone: '0102030405',
        job: 'nurse',
      },
      stripe: {},
    });
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
      })
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
      .reply(200)
      .get('/persons/fakePersonId/deals')
      .query({
        status: 'open',
      })
      .reply(200, {
        data: [],
      });

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    scope.done();
    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
  });

  it('should update person and deal when user is an opportunity', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      emails: [{
        address: 'john.doe@example.com',
      }],
      profile: {
        phone: '0102030405',
        job: 'nurse',
      },
      stripe: {},
    });
    mockDB.countUserBankAccounts.mockResolvedValue(0);
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
      })
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
      .reply(200)
      .get('/persons/fakePersonId/deals')
      .query({
        status: 'open',
      })
      .reply(200, {
        data: [
          { id: 'fakeDealId' },
        ],
      })
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

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    scope.done();
    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockDB.countUserBankAccounts.mock.calls.length).toBe(1);
    expect(mockDB.countUserBankAccounts.mock.calls[0].length).toBe(1);
    expect(mockDB.countUserBankAccounts.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
  });

  it('should update person and deal when user is in ongoing trial', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      emails: [{
        address: 'john.doe@example.com',
      }],
      profile: {
        phone: '0102030405',
        job: 'nurse',
      },
      stripe: {},
    });
    mockDB.countUserBankAccounts.mockResolvedValue(2);
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
      })
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
      .reply(200)
      .get('/persons/fakePersonId/deals')
      .query({
        status: 'open',
      })
      .reply(200, {
        data: [
          { id: 'fakeDealId' },
        ],
      })
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

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    scope.done();
    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockDB.countUserBankAccounts.mock.calls.length).toBe(1);
    expect(mockDB.countUserBankAccounts.mock.calls[0].length).toBe(1);
    expect(mockDB.countUserBankAccounts.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
  });
});
