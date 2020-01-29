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
    getUserById({ userId }) {
      return Users.findOne({ _id: userId });
    },
    countUserBankAccounts({ userId }) {
      return BankAccounts.countDocuments({ id_user: userId });
    },
    async close() {
      await client.close();
    },
  };
};
