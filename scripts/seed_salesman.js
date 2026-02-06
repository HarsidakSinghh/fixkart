const { MongoClient } = require('mongodb');

const SAMPLE = {
  id: 'smn_karan_001',
  name: 'Karan Field',
  phone: '7417417417',
  code: '8888',
  status: 'ACTIVE',
  currentLat: 30.9084898,
  currentLng: 75.9003737,
};

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error('DATABASE_URL is not set');
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  await db.collection('Salesman').updateOne(
    { phone: SAMPLE.phone, code: SAMPLE.code },
    {
      $set: {
        name: SAMPLE.name,
        phone: SAMPLE.phone,
        code: SAMPLE.code,
        status: SAMPLE.status,
        currentLat: SAMPLE.currentLat,
        currentLng: SAMPLE.currentLng,
        lastUpdated: new Date(),
      },
      $setOnInsert: {
        _id: SAMPLE.id,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  );

  console.log('Salesman seeded:', SAMPLE.phone, SAMPLE.code);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
