const { dbUserToPipedriveUser } = require('../src/db.js');

describe('db', () => {
  describe('dbUserToPipedriveUser', () => {
    it('should format unsubscribed user with no bank account', () => {
      const user = dbUserToPipedriveUser({
        dbUser: {
          _id: '#fakeUserId',
          emails: [{
            address: 'john.doe@example.com',
          }],
          profile: {
            phone: '0102030405',
            job: 'nurse',
          },
          stripe: {},
        },
        bankAccountsCount: 0,
      });

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: false,
      });
    });

    it('should format unsubscribed user with some bank account', () => {
      const user = dbUserToPipedriveUser({
        dbUser: {
          _id: '#fakeUserId',
          emails: [{
            address: 'john.doe@example.com',
          }],
          profile: {
            phone: '0102030405',
            job: 'nurse',
          },
          stripe: {},
        },
        bankAccountsCount: 2,
      });

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: true,
      });
    });

    it('should retrieve subscribed user with some bank account from "users" collection', () => {
      const user = dbUserToPipedriveUser({
        dbUser: {
          _id: '#fakeUserId',
          emails: [{
            address: 'john.doe@example.com',
          }],
          profile: {
            phone: '0102030405',
            job: 'nurse',
          },
          stripe: { plan: 'normal24' },
        },
        bankAccountsCount: 2,
      });

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: true,
        hasSynchronizedBankAccount: true,
      });
    });

    it('should ignore undefined user', () => {
      const user = dbUserToPipedriveUser({
        dbUser: null,
        bankAccountsCount: 0,
      });

      expect(user).toBe(undefined);
    });
  });
});
