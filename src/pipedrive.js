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
    updatePerson,
    getOpenDealIdForPerson,
    updateDealStage,
  },
}) {
  const user = await getUserById({ userId });
  if (!user) {
    console.log('No user found');
    return;
  }

  const personId = await getPersonIdBySiren({ siren });
  if (!personId) {
    console.log('No person found');
    return;
  }

  await updatePerson({
    personId,
    data: {
      email: user.email,
      phone: user.phone,
      siren,
      georgesUserId: userId,
      jobLabel: user.job,
    },
  });

  if (user.isSubscribed) {
    console.log('User already subscribed');
    return;
  }

  const dealId = await getOpenDealIdForPerson({ personId });
  if (!dealId) {
    console.log('No deal found');
    return;
  }

  const stage = user.hasSynchronizedBankAccount ? 'ongoing_trials' : 'opportunities';
  await updateDealStage({
    dealId,
    stage,
  });
}
