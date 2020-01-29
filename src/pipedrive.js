const _ = require('lodash');

module.exports = {
  updateUserInCRM,
};

async function updateUserInCRM({
  userId, siren,
  db: {
    getUserById,
  },
  api: {
    getPersonIdBySiren,
    getOpenDealIdForPerson,
  },
}) {
  const user = await getUserById({ userId });
  if (!user) {
    console.log('No user found');
    return undefined;
  }

  const personId = await getPersonIdBySiren({ siren });
  if (!personId) {
    console.log('No person found');
    return undefined;
  }

  const updatePerson = {
    personId,
    data: {
      email: user.email,
      phone: user.phone,
      siren,
      georgesUserId: userId,
      jobLabel: user.job,
    },
  };

  if (user.isSubscribed) {
    console.log('User already subscribed');
    return { updatePerson };
  }

  const dealId = await getOpenDealIdForPerson({ personId });
  if (!dealId) {
    console.log('No deal found');
    return { updatePerson };
  }

  const stage = user.hasSynchronizedBankAccount ? 'ongoing_trials' : 'opportunities';
  const updateDealStage = {
    dealId,
    stage,
  };
  return {
    updatePerson,
    updateDealStage,
  };
}
