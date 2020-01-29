const { updateUserInCRM } = require('../src/pipedrive.js');

describe('pipedrive', () => {
  it('should do nothing when user is not found', async () => {
    const updates = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {},
      db: {
        getUserById: () => undefined,
      },
    });

    expect(updates).toBe(undefined);
  });

  it('should do nothing when person with SIREN is not found', async () => {
    const updates = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {
        getPersonIdBySiren: () => undefined,
      },
      db: {
        getUserById: ({ userId }) => (userId === '#fakeUserId' && {
          _id: '#fakeUserId',
          email: 'john.doe@example.com',
          phone: '0102030405',
          job: 'nurse',
          isSubscribed: false,
          hasSynchronizedBankAccount: false,
        }),
      },
    });

    expect(updates).toBe(undefined);
  });

  it('should update person with SIREN and not update deal when user is already subscribed', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {
        getPersonIdBySiren: ({ siren }) => (
          siren === '123456789' && 'fakePersonId'
        ),
      },
      db: {
        getUserById: ({ userId }) => (userId === '#fakeUserId' && {
          _id: '#fakeUserId',
          email: 'john.doe@example.com',
          phone: '0102030405',
          job: 'nurse',
          isSubscribed: true,
          hasSynchronizedBankAccount: false,
        }),
      },
    });

    expect(updatePerson).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(updateDealStage).toBe(undefined);
  });

  it('should update person with SIREN then stop when open deal is not found', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {
        getPersonIdBySiren: ({ siren }) => (
          siren === '123456789' && 'fakePersonId'
        ),
        getOpenDealIdForPerson: () => undefined,
      },
      db: {
        getUserById: ({ userId }) => (userId === '#fakeUserId' && {
          _id: '#fakeUserId',
          email: 'john.doe@example.com',
          phone: '0102030405',
          job: 'nurse',
          isSubscribed: false,
          hasSynchronizedBankAccount: false,
        }),
      },
    });

    expect(updateDealStage).toBe(undefined);
  });

  it('should update person and deal when user is an opportunity', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {
        getPersonIdBySiren: ({ siren }) => (
          siren === '123456789' && 'fakePersonId'
        ),
        getOpenDealIdForPerson: ({ personId }) => (
          personId === 'fakePersonId' && 'fakeDealId'
        ),
      },
      db: {
        getUserById: ({ userId }) => (userId === '#fakeUserId' && {
          _id: '#fakeUserId',
          email: 'john.doe@example.com',
          phone: '0102030405',
          job: 'nurse',
          isSubscribed: false,
          hasSynchronizedBankAccount: false,
        }),
      },
    });

    expect(updatePerson).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(updateDealStage).toEqual({
      dealId: 'fakeDealId',
      stage: 'opportunities',
    });
  });

  it('should update person and deal when user is in ongoing trial', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      userId: '#fakeUserId',
      siren: '123456789',
      api: {
        getPersonIdBySiren: ({ siren }) => (
          siren === '123456789' && 'fakePersonId'
        ),
        getOpenDealIdForPerson: ({ personId }) => (
          personId === 'fakePersonId' && 'fakeDealId'
        ),
      },
      db: {
        getUserById: ({ userId }) => (userId === '#fakeUserId' && {
          _id: '#fakeUserId',
          email: 'john.doe@example.com',
          phone: '0102030405',
          job: 'nurse',
          isSubscribed: false,
          hasSynchronizedBankAccount: true,
        }),
      },
    });

    expect(updatePerson).toEqual({
      personId: 'fakePersonId',
      data: {
        email: 'john.doe@example.com',
        phone: '0102030405',
        siren: '123456789',
        georgesUserId: '#fakeUserId',
        jobLabel: 'nurse',
      },
    });
    expect(updateDealStage).toEqual({
      dealId: 'fakeDealId',
      stage: 'ongoing_trials',
    });
  });
});
