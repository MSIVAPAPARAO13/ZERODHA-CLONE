require('dotenv').config();
const mongoose = require('mongoose');
const { UserModel } = require('./models/UserModel');

mongoose.connect(process.env.MONGO_URL).then(async () => {
  try {
    const result = await UserModel.updateMany(
      { virtualBalance: { $exists: false } },
      { $set: { virtualBalance: 100000 } }
    );
    console.log(`Migration Complete. Modified: ${result.modifiedCount}`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
});
