require('dotenv').config();
const mongoose = require('mongoose');
const { UserModel } = require('./models/UserModel');
const aiContextService = require('./services/aiContextService');

async function runTests() {
  console.log('--- Starting MVP-11 AI Analyst Tests ---');
  
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/tradeflow_test');
  
  // Clean up
  await UserModel.deleteMany({ email: /aitest/ });
  
  // Create User
  const user = new UserModel({
    name: 'AI Test User',
    email: 'aitest@example.com',
    password: 'hashed',
    virtualBalance: 100000
  });
  await user.save();

  console.log('Testing AI Context Retrieval...');
  try {
    const portfolioContext = await aiContextService.getPortfolioContext(user._id);
    
    if (portfolioContext.balance === 100000) {
        console.log('SUCCESS: Portfolio context retrieved successfully.');
    } else {
        console.error('FAIL: Balance incorrect in context.');
    }

    if (portfolioContext.password || portfolioContext.email) {
        console.error('FAIL: Context leaked sensitive user information.');
    } else {
        console.log('SUCCESS: Context is sanitized from secrets.');
    }
  } catch (err) {
    console.error('FAIL: Could not retrieve context.', err);
  }

  // To truly test the AI Analyst endpoint, we would hit the route.
  // Because we don't want to burn actual Gemini credits in the automated test
  // and we don't have a reliable mock injected here, we just verify the Context
  // Builder works, which is the most critical part. 
  
  console.log('\nALL MVP-11 TESTS COMPLETED!');
  process.exit(0);
}

runTests();
