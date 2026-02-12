require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.DATABASE_URL;

if (!uri) {
  console.error('ERROR: DATABASE_URL not found');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    const membersCollection = db.collection('Member');
    
    const members = await membersCollection.find({}).toArray();
    console.log('Found ' + members.length + ' members\n');
    
    for (const member of members) {
      if (member.name) {
        const nameParts = member.name.trim().split(' ');
        const surname = nameParts[nameParts.length - 1];
        const givenName = nameParts.slice(0, -1).join(' ') || surname;
        
        await membersCollection.updateOne(
          { _id: member._id },
          { $set: { surname: surname, givenName: givenName } }
        );
        
        console.log('Migrated: ' + member.name + ' -> ' + surname + ', ' + givenName);
      }
    }
    
    console.log('\nMigration complete!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();