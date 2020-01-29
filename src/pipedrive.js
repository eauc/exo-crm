const _ = require('lodash');

module.exports = {
  updateUserInCRM,
};

async function updateUserInCRM({
  user,
  siren,
  personId,
  dealId,
}) {
  if (!user) {
    console.log('No user found');
    return undefined;
  }

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
      georgesUserId: user._id,
      jobLabel: user.job,
    },
  };

  if (user.isSubscribed) {
    console.log('User already subscribed');
    return { updatePerson };
  }

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
