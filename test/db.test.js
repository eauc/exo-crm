const { getDB } = require('../src/db.js');
const { MongoClient } = require('mongodb');

describe('db', () => {
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

  describe('getUserById', () => {
    it('should retrieve unsubscribed user with no bank account from "users" collection', async () => {
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
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const user = await db.getUserById({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: false,
      });
    });

    it('should retrieve unsubscribed user with some bank account from "users" collection', async () => {
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
      BankAccounts.insertMany([{
        _id: '#fakeBankAccountId1',
        id_user: '#fakeUserId',
      }, {
        _id: '#fakeBankAccountId2',
        id_user: '#fakeUserId',
      }]);
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const user = await db.getUserById({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: false,
        hasSynchronizedBankAccount: true,
      });
    });

    it('should retrieve subscribed user with some bank account from "users" collection', async () => {
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
      BankAccounts.insertMany([{
        _id: '#fakeBankAccountId1',
        id_user: '#fakeUserId',
      }, {
        _id: '#fakeBankAccountId2',
        id_user: '#fakeUserId',
      }]);
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const user = await db.getUserById({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(user).toEqual({
        _id: '#fakeUserId',
        email: 'john.doe@example.com',
        phone: '0102030405',
        job: 'nurse',
        isSubscribed: true,
        hasSynchronizedBankAccount: true,
      });
    });

    it('should retrieve no user if not found', async () => {
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const user = await db.getUserById({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(user).toBe(undefined);
    });
  });

  describe('countUserBankAcccounts', () => {
    it('should count bank accounts related to userId in "bank_accounts" collection (1)', async () => {
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const count = await db.countUserBankAccounts({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(count).toBe(0);
    });

    it('should count bank accounts related to userId in "bank_accounts" collection (1)', async () => {
      BankAccounts.insertMany([{
        _id: '#fakeBankAccountId',
        id_user: '#fakeUserId',
      }]);
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const count = await db.countUserBankAccounts({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(count).toBe(1);
    });

    it('should count bank accounts related to userId in "bank_accounts" collection (2)', async () => {
      BankAccounts.insertMany([{
        _id: '#fakeBankAccountId1',
        id_user: '#fakeUserId',
      }, {
        _id: '#fakeBankAccountId2',
        id_user: '#fakeUserId',
      }]);
      const db = await getDB({
        url: 'mongodb://localhost:27017',
        dbName: 'test',
      });
      const count = await db.countUserBankAccounts({
        userId: '#fakeUserId',
      });
      await db.close();

      expect(count).toBe(2);
    });
  });
});
