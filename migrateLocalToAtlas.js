import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const localUri = process.env.MONGO_FALLBACK_URI;
const atlasUri = process.env.MONGO_URI;

const migrate = async () => {
  if (!localUri || !atlasUri) {
    throw new Error('Both MONGO_FALLBACK_URI and MONGO_URI must be defined');
  }

  const localConn = await mongoose.createConnection(localUri).asPromise();
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();

  try {
    const collections = await localConn.db.listCollections().toArray();

    if (collections.length === 0) {
      console.log('No local collections found to migrate.');
      return;
    }

    for (const { name } of collections) {
      const sourceCollection = localConn.db.collection(name);
      const targetCollection = atlasConn.db.collection(name);
      const documents = await sourceCollection.find({}).toArray();

      await targetCollection.deleteMany({});

      if (documents.length > 0) {
        await targetCollection.insertMany(documents, { ordered: false });
      }

      console.log(`Migrated ${documents.length} documents from ${name}`);
    }

    console.log('Local MongoDB data copied to Atlas successfully.');
  } finally {
    await localConn.close();
    await atlasConn.close();
  }
};

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`Migration failed: ${error.message}`);
    process.exit(1);
  });
