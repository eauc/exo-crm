const { updateUserInCRM } = require('../src/pipedrive.js');
const dbModule = require('../src/db.js');
const api = require('../src/api.js');

jest.mock('../src/db.js');
jest.mock('../src/api.js');

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
    jest.clearAllMocks();
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
      email: 'john.doe@example.com',
      phone: '0102030405',
      job: 'nurse',
      isSubscribed: false,
      hasSynchronizedBankAccounts: false,
    });
    api.getPersonIdBySiren.mockResolvedValue(undefined);

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(api.getPersonIdBySiren.mock.calls.length).toBe(1);
    expect(api.getPersonIdBySiren.mock.calls[0].length).toBe(1);
    expect(api.getPersonIdBySiren.mock.calls[0][0]).toEqual({
      siren: '123456789',
    });
  });

  it('should update person with SIREN and not update deal when user is already subscribed', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      email: 'john.doe@example.com',
      phone: '0102030405',
      job: 'nurse',
      isSubscribed: true,
      hasSynchronizedBankAccounts: false,
    });
    api.getPersonIdBySiren.mockResolvedValue('fakePersonId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(api.getPersonIdBySiren.mock.calls.length).toBe(1);
    expect(api.getPersonIdBySiren.mock.calls[0].length).toBe(1);
    expect(api.getPersonIdBySiren.mock.calls[0][0]).toEqual({
      siren: '123456789',
    });
    expect(api.updatePerson.mock.calls.length).toBe(1);
    expect(api.updatePerson.mock.calls[0].length).toBe(1);
    expect(api.updatePerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
  });

  it('should update person with SIREN then stop when open deal is not found', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      email: 'john.doe@example.com',
      phone: '0102030405',
      job: 'nurse',
      isSubscribed: false,
      hasSynchronizedBankAccounts: false,
    });
    api.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    api.getOpenDealIdForPerson.mockResolvedValue(undefined);

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(api.getOpenDealIdForPerson.mock.calls.length).toBe(1);
    expect(api.getOpenDealIdForPerson.mock.calls[0].length).toBe(1);
    expect(api.getOpenDealIdForPerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
    });
  });

  it('should update person and deal when user is an opportunity', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      email: 'john.doe@example.com',
      phone: '0102030405',
      job: 'nurse',
      isSubscribed: false,
      hasSynchronizedBankAccounts: false,
    });
    mockDB.countUserBankAccounts.mockResolvedValue(0);
    api.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    api.getOpenDealIdForPerson.mockResolvedValue('fakeDealId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(api.updatePerson.mock.calls.length).toBe(1);
    expect(api.updatePerson.mock.calls[0].length).toBe(1);
    expect(api.updatePerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(api.updateDealStage.mock.calls.length).toBe(1);
    expect(api.updateDealStage.mock.calls[0].length).toBe(1);
    expect(api.updateDealStage.mock.calls[0][0]).toEqual({
      dealId: 'fakeDealId',
      stage: 'opportunities',
    });
  });

  it('should update person and deal when user is in ongoing trial', async () => {
    mockDB.getUserById.mockResolvedValue({
      _id: '#fakeUserId',
      email: 'john.doe@example.com',
      phone: '0102030405',
      job: 'nurse',
      isSubscribed: false,
      hasSynchronizedBankAccount: true,
    });
    api.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    api.getOpenDealIdForPerson.mockResolvedValue('fakeDealId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(api.updatePerson.mock.calls.length).toBe(1);
    expect(api.updatePerson.mock.calls[0].length).toBe(1);
    expect(api.updatePerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(api.updateDealStage.mock.calls.length).toBe(1);
    expect(api.updateDealStage.mock.calls[0].length).toBe(1);
    expect(api.updateDealStage.mock.calls[0][0]).toEqual({
      dealId: 'fakeDealId',
      stage: 'ongoing_trials',
    });
  });
});
