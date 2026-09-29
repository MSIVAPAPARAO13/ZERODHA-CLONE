require('dotenv').config();
const mongoose = require('mongoose');
const { UserModel } = require('./models/UserModel');
const { PlaybookModel } = require('./models/PlaybookModel');
const playbookService = require('./services/playbookService');
const aiContextService = require('./services/aiContextService');

async function runTests() {
  console.log('--- Starting MVP-13 Adaptive Decision Loop Tests ---');
  
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tradeflow_test');
  
  // Clean up
  await UserModel.deleteMany({ email: /playbooktest/ });
  await PlaybookModel.deleteMany({});
  
  // Create User
  const user = new UserModel({
    name: 'Playbook Test User',
    email: 'playbooktest@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await user.save();
  const userB = new UserModel({
    name: 'Playbook Test User B',
    email: 'playbooktestb@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await userB.save();

  console.log('Testing Playbook CRUD & Limits...');
  
  const pb1 = await playbookService.createPlaybook(user._id, {
      name: 'Momentum Master',
      rules: [{ text: 'Always use stop loss' }, { text: 'Wait for volume' }]
  });
  
  if (pb1.name === 'Momentum Master' && pb1.rules.length === 2) {
      console.log('SUCCESS: Playbook created.');
  } else {
      console.error('FAIL: Playbook creation failed.', pb1);
  }

  // Duplicate rule text check (same playbook)
  try {
      const pb2 = await playbookService.createPlaybook(user._id, {
          name: 'Dupe Test',
          rules: [{ text: 'duplicate' }, { text: ' DUPLICATE ' }] // Should only save 1
      });
      if (pb2.rules.length === 1) {
          console.log('SUCCESS: Duplicate rule protection works.');
      } else {
          console.error('FAIL: Duplicate rule protection failed.', pb2.rules);
      }
  } catch(e) {
      console.error('FAIL: Duplicate rule test threw error.', e);
  }

  console.log('Testing User Isolation...');
  const userB_pbs = await playbookService.getPlaybooks(userB._id);
  if (userB_pbs.length === 0) {
      console.log('SUCCESS: User B cannot see User A playbooks.');
  } else {
      console.error('FAIL: Isolation broken.');
  }

  try {
      await playbookService.updatePlaybook(pb1._id, userB._id, { name: 'Hacked' });
      console.error('FAIL: User B updated User A playbook.');
  } catch (e) {
      console.log('SUCCESS: User B prevented from updating User A playbook.');
  }

  console.log('Testing AI Suggestion Context...');
  const ctx = await aiContextService.getPlaybookSuggestionContext({ pattern: 'TARGET_WITHOUT_RISK', desc: 'Desc' });
  if (ctx.type === 'PLAYBOOK_SUGGESTION' && ctx.pattern === 'TARGET_WITHOUT_RISK') {
      console.log('SUCCESS: AI suggestion context built securely.');
  } else {
      console.error('FAIL: AI context builder failed.', ctx);
  }

  console.log('\nALL MVP-13 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
