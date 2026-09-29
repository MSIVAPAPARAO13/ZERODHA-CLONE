require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  const db = mongoose.connection.db;
  const user = await db.collection('users').findOne({ email: 'demo@tradeflow.local' });
  const orders = await db.collection('orders').countDocuments({ user: user._id });
  const holdings = await db.collection('holdings').countDocuments({ user: user._id });
  const positions = await db.collection('positions').countDocuments({ user: user._id });
  console.log(`Demo User Orders: ${orders}, Holdings: ${holdings}, Positions: ${positions}`);
  process.exit(0);
});
