const { updateUserInCRM } = require('../src/pipedrive.js');

describe('pipedrive', () => {
  let mockDB;
  let mockAPI;

  beforeEach(() => {
    mockDB = {
      getUserById: jest.fn(),
      countUserBankAccounts: jest.fn(),
      close: jest.fn(),
    };
    mockAPI = {
      getPersonIdBySiren: jest.fn(),
      updatePerson: jest.fn(),
      getOpenDealIdForPerson: jest.fn(),
      updateDealStage: jest.fn(),
    };
  });

  it('should do nothing when user is not found', async () => {
    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
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
    mockAPI.getPersonIdBySiren.mockResolvedValue(undefined);

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockAPI.getPersonIdBySiren.mock.calls.length).toBe(1);
    expect(mockAPI.getPersonIdBySiren.mock.calls[0].length).toBe(1);
    expect(mockAPI.getPersonIdBySiren.mock.calls[0][0]).toEqual({
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
    mockAPI.getPersonIdBySiren.mockResolvedValue('fakePersonId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockAPI.getPersonIdBySiren.mock.calls.length).toBe(1);
    expect(mockAPI.getPersonIdBySiren.mock.calls[0].length).toBe(1);
    expect(mockAPI.getPersonIdBySiren.mock.calls[0][0]).toEqual({
      siren: '123456789',
    });
    expect(mockAPI.updatePerson.mock.calls.length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0].length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0][0]).toEqual({
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
    mockAPI.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    mockAPI.getOpenDealIdForPerson.mockResolvedValue(undefined);

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockAPI.getOpenDealIdForPerson.mock.calls.length).toBe(1);
    expect(mockAPI.getOpenDealIdForPerson.mock.calls[0].length).toBe(1);
    expect(mockAPI.getOpenDealIdForPerson.mock.calls[0][0]).toEqual({
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
    mockAPI.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    mockAPI.getOpenDealIdForPerson.mockResolvedValue('fakeDealId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockAPI.updatePerson.mock.calls.length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0].length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(mockAPI.updateDealStage.mock.calls.length).toBe(1);
    expect(mockAPI.updateDealStage.mock.calls[0].length).toBe(1);
    expect(mockAPI.updateDealStage.mock.calls[0][0]).toEqual({
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
    mockAPI.getPersonIdBySiren.mockResolvedValue('fakePersonId');
    mockAPI.getOpenDealIdForPerson.mockResolvedValue('fakeDealId');

    await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: mockAPI,
      db: mockDB,
    });

    expect(mockDB.getUserById.mock.calls.length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0].length).toBe(1);
    expect(mockDB.getUserById.mock.calls[0][0]).toEqual({
      userId: '#fakeUserId',
    });
    expect(mockAPI.updatePerson.mock.calls.length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0].length).toBe(1);
    expect(mockAPI.updatePerson.mock.calls[0][0]).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(mockAPI.updateDealStage.mock.calls.length).toBe(1);
    expect(mockAPI.updateDealStage.mock.calls[0].length).toBe(1);
    expect(mockAPI.updateDealStage.mock.calls[0][0]).toEqual({
      dealId: 'fakeDealId',
      stage: 'ongoing_trials',
    });
  });
});
