const { updateUserInCRM } = require('../src/pipedrive.js');

describe('pipedrive', () => {
  it('should do nothing when user is not found', async () => {
    const updates = await updateUserInCRM({
      user: undefined,
      siren: '123456789',
      personId: undefined,
      dealId: undefined,
    });

    expect(updates).toBe(undefined);
  });

  it('should do nothing when person with SIREN is not found', async () => {
    const updates = await updateUserInCRM({
      user: {
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: false,
      },
      siren: '123456789',
      personId: undefined,
      dealId: undefined,
    });

    expect(updates).toBe(undefined);
  });

  it('should update person with SIREN and not update deal when user is already subscribed', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      user: {
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: true,
        hasSynchronizedBankAccount: false,
      },
      siren: '123456789',
      personId: 'fakePersonId',
      dealId: undefined,
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
      user: {
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: false,
      },
      siren: '123456789',
      personId: 'fakePersonId',
      dealId: undefined,
    });

    expect(updateDealStage).toBe(undefined);
  });

  it('should update person and deal when user is an opportunity', async () => {
    const {
      updatePerson,
      updateDealStage,
    } = await updateUserInCRM({
      user: {
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: false,
      },
      siren: '123456789',
      personId: 'fakePersonId',
      dealId: 'fakeDealId',
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
      user: {
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: true,
      },
      siren: '123456789',
      personId: 'fakePersonId',
      dealId: 'fakeDealId',
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
