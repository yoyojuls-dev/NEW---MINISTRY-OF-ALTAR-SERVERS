// scripts/migrate-names-simple.js
// Simpler migration using MongoDB directly
// Run with: node scripts/migrate-names-simple.js

const { MongoClient } = require('mongodb');

// Get your MongoDB connection string from .env
const uri = process.env.DATABASE_URL || 'your-mongodb-connection-string';

async function migrate() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    const membersCollection = db.collection('Member');
    
    // Find all members
    const members = await membersCollection.find({}).toArray();
    console.log(`Found ${members.length} members\n`);
    
    for (const member of members) {
      if (member.name) {
        // Split name
        const nameParts = member.name.trim().split(' ');
        const surname = nameParts[nameParts.length - 1];
        const givenName = nameParts.slice(0, -1).join(' ') || surname;
        
        // Update document
        await membersCollection.updateOne(
          { _id: member._id },
          { 
            $set: { 
              surname: surname,
              givenName: givenName 
            }
          }
        );
        
        console.log(`✅ "${member.name}" → "${surname}, ${givenName}"`);
      } else {
        // Set defaults if no name
        await membersCollection.updateOne(
          { _id: member._id },
          { 
            $set: { 
              surname: 'Unknown',
              givenName: 'Unknown'
            }
          }
        );
        console.log(`⚠️  Member ${member._id} has no name, set to "Unknown"`);
      }
    }
    
    console.log('\n✅ Migration complete!');
    
    // Verify
    const sample = await membersCollection.find({}).limit(5).toArray();
    console.log('\nSample of migrated members:');
    sample.forEach(m => {
      console.log(`  - ${m.surname}, ${m.givenName}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
  }
}

migrate();