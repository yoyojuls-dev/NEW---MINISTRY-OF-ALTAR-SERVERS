// scripts/migrate-names-fixed.js
// Run with: node scripts/migrate-names-fixed.js

require('dotenv').config(); // Load .env file
const { MongoClient } = require('mongodb');

// Get MongoDB connection string from .env
const uri = process.env.DATABASE_URL;

if (!uri) {
  console.error('❌ ERROR: DATABASE_URL not found in .env file');
  console.error('Please make sure your .env file has DATABASE_URL set');
  process.exit(1);
}

async function migrate() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db();
    const membersCollection = db.collection('Member');
    
    // Find all members
    const members = await membersCollection.find({}).toArray();
    console.log(`Found ${members.length} members\n`);
    
    if (members.length === 0) {
      console.log('⚠️  No members found in database');
      return;
    }
    
    let migrated = 0;
    let skipped = 0;
    
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
        migrated++;
      } else if (!member.surname || !member.givenName) {
        // Set defaults if no name and fields are empty
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
        skipped++;
      } else {
        console.log(`ℹ️  Member already has surname/givenName, skipping`);
        skipped++;
      }
    }
    
    console.log('\n✅ Migration complete!');
    console.log(`   Migrated: ${migrated}`);
    console.log(`   Skipped: ${skipped}`);
    
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