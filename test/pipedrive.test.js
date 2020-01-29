const { updateUserInCRM } = require('../src/pipedrive.js');
const { MongoClient } = require('mongodb');
const nock = require('nock');

describe('pipedrive', () => {
  let client;
  let BankAccounts;
  let Users;

  beforeEach(async () => {
    client = await MongoClient.connect('mongodb://localhost:27017', {
      useUnifiedTopology: true,
    });
    const db = client.db('test');
    BankAccounts = db.collection('bank_accounts');
    Users = db.collection('users');
  });

  afterEach(async () => {
      await Users.deleteMany();
      await BankAccounts.deleteMany();
      await client.close();
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
    Users.insertOne({
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
  });

  it('should update person with SIREN and not update deal when user is already subscribed', async () => {
    Users.insertOne({
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
  });

  it('should update person with SIREN then stop when open deal is not found', async () => {
    Users.insertOne({
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
  });

  it('should update person and deal when user is an opportunity', async () => {
    Users.insertOne({
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
  });

  it('should update person and deal when user is in ongoing trial', async () => {
    Users.insertOne({
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
    BankAccounts.insertOne({
      _id: '#fakeBankAccountId',
      id_user: '#fakeUserId',
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
  });
});
