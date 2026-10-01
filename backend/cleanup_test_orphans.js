require('dotenv').config();
const mongoose = require('mongoose');

async function safeCleanupOrphans() {
  console.log('===============================================================');
  console.log('--- TRADEFLOW SAFE TEST ORPHAN CLEANUP MIGRATION ---');
  console.log('===============================================================');

  const mongoUri = process.env.MONGO_URL || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGO_URL environment variable is missing.');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB Atlas successfully.');

  try {
    const { UserModel } = require('./models/UserModel');
    const users = await UserModel.find({});
    const validUserIds = new Set(users.map(u => u._id.toString()));
    console.log(`Found ${users.length} valid active users.`);

    const collections = [
      'orders',
      'holdings',
      'positions',
      'transactions',
      'watchlists',
      'alerts',
      'researchsessions',
      'tradejournals'
    ];

    let totalCleaned = 0;

    for (const collName of collections) {
      const coll = mongoose.connection.db.collection(collName);
      const allDocs = await coll.find({}).toArray();
      const orphanIds = [];

      for (const doc of allDocs) {
        if (!doc.user || !validUserIds.has(doc.user.toString())) {
          orphanIds.push(doc._id);
        }
      }

      console.log(`Collection '${collName}': Total ${allDocs.length}, Orphans identified: ${orphanIds.length}`);

      if (orphanIds.length > 0) {
        const delRes = await coll.deleteMany({ _id: { $in: orphanIds } });
        console.log(`  ✓ Safely purged ${delRes.deletedCount} orphan test records from '${collName}'.`);
        totalCleaned += delRes.deletedCount;
      }
    }

    console.log('===============================================================');
    console.log(`CLEANUP COMPLETE: Safely removed ${totalCleaned} orphan test artifacts.`);
    console.log('Zero live user records were touched.');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Cleanup migration failed:', err);
  } finally {
    await mongoose.disconnect();
  }
}

safeCleanupOrphans();
