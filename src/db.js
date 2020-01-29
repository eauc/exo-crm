const { MongoClient } = require('mongodb');

module.exports = {
  getDB,
};

async function getDB({ url, dbName }) {
  const client = await MongoClient.connect(url, {
    useUnifiedTopology: true,
  });
  const db = client.db(dbName);
  const Users = db.collection('users');
  const BankAccounts = db.collection('bank_accounts');
  return {
    async getUserById({ userId }) {
      const dbUser = await Users.findOne({ _id: userId });
      if (!dbUser) {
        return undefined;
      }
      const bankAccountsCount = await _countUserBankAccounts({ userId, BankAccounts });
      return {
        _id: dbUser._id,
        email: dbUser.emails[0].address,
        phone: dbUser.profile.phone,
        job: dbUser.profile.job,
        isSubscribed: Boolean(dbUser.stripe.plan),
        hasSynchronizedBankAccount: bankAccountsCount > 0,
      };
    },
    countUserBankAccounts({ userId }) {
      return _countUserBankAccounts({ userId, BankAccounts });
    },
    async close() {
      await client.close();
    },
  };
};

function _countUserBankAccounts({ userId, BankAccounts }) {
  return BankAccounts.countDocuments({ id_user: userId });
}
