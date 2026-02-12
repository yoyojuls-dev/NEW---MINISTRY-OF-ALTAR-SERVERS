// Database seeding script for Ministry of Altar Servers
// Run with: npx ts-node scripts/seed-ministry.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedMinistry() {
  console.log('🌱 Seeding Ministry of Altar Servers data...');

  try {
    // 1. Create Ministry Settings
    console.log('⚙️ Setting up ministry configuration...');
    
    const existingSettings = await prisma.ministrySettings.findFirst();
    
    if (!existingSettings) {
      await prisma.ministrySettings.create({
        data: {
          ministryName: 'Ministry of Altar Servers',
          parishName: 'Sample Parish Church',
          contactEmail: 'ministry@parish.com',
          contactNumber: '+63 912 345 6789',
          monthlyDuesAmount: 100.0,
          duesDescription: 'Monthly contribution for ministry activities and equipment',
          attendanceGracePeriod: 15,
          birthdayReminders: true,
          eventReminders: true,
          duesReminders: true,
        },
      });
      console.log('✅ Ministry settings configured');
    } else {
      console.log('⏭️ Ministry settings already exist, skipping...');
    }

    // 2. Create Default Admin User
    console.log('👤 Creating default admin user...');
    
    const existingAdmin = await prisma.adminUser.findFirst({
      where: { email: 'admin@ministry.com' }
    });

    let adminUser;
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      adminUser = await prisma.adminUser.create({
        data: {
          adminId: 'ADM-001',
          name: 'Ministry Administrator',
          email: 'admin@ministry.com',
          hashedPassword: hashedPassword,
          position: 'Ministry Coordinator',
          permissions: ['manage_members', 'manage_events', 'manage_finances', 'manage_attendance', 'view_reports'],
          contactNumber: '+63 912 345 6789',
          isActive: true,
        },
      });
      console.log('✅ Default admin user created: admin@ministry.com (password: admin123)');
    } else {
      adminUser = existingAdmin;
      console.log('⏭️ Admin user already exists, skipping...');
    }

    // 3. Create Sample Members
    console.log('👥 Creating sample altar server members...');
    
    const sampleMembers = [
      {
        memberId: 'AS-001',
        name: 'John Michael Santos',
        birthdate: new Date('2005-03-15'),
        email: 'john.santos@email.com',
        contactNumber: '+63 912 111 1111',
        address: '123 Church St, Parish City',
        parentGuardian: 'Maria Santos',
        parentContact: '+63 912 111 1112',
        serverLevel: 'SENIOR' as const,
        memberStatus: 'ACTIVE' as const,
        trainedFor: ['Sunday Mass', 'Daily Mass', 'Special Events'],
        school: 'Parish High School',
      },
      {
        memberId: 'AS-002',
        name: 'Maria Grace Cruz',
        birthdate: new Date('2006-07-22'),
        email: 'maria.cruz@email.com',
        contactNumber: '+63 912 222 2222',
        address: '456 Faith Ave, Parish City',
        parentGuardian: 'Juan Cruz',
        parentContact: '+63 912 222 2223',
        serverLevel: 'JUNIOR' as const,
        memberStatus: 'ACTIVE' as const,
        trainedFor: ['Sunday Mass', 'Daily Mass'],
        school: 'Parish Elementary School',
      },
      {
        memberId: 'AS-003',
        name: 'David Paul Rodriguez',
        birthdate: new Date('2004-11-08'),
        email: 'david.rodriguez@email.com',
        contactNumber: '+63 912 333 3333',
        address: '789 Hope Blvd, Parish City',
        parentGuardian: 'Anna Rodriguez',
        parentContact: '+63 912 333 3334',
        serverLevel: 'MASTER' as const,
        memberStatus: 'ACTIVE' as const,
        trainedFor: ['Sunday Mass', 'Daily Mass', 'Special Events', 'Training Others'],
        school: 'Parish University',
      },
      {
        memberId: 'AS-004',
        name: 'Sarah Joy Kim',
        birthdate: new Date('2005-12-03'),
        email: 'sarah.kim@email.com',
        contactNumber: '+63 912 444 4444',
        address: '321 Love St, Parish City',
        parentGuardian: 'Peter Kim',
        parentContact: '+63 912 444 4445',
        serverLevel: 'SENIOR' as const,
        memberStatus: 'ACTIVE' as const,
        trainedFor: ['Sunday Mass', 'Daily Mass', 'Special Events'],
        school: 'Parish High School',
      },
      {
        memberId: 'AS-005',
        name: 'Mark Anthony Dela Cruz',
        birthdate: new Date('2006-02-14'),
        email: 'mark.delacruz@email.com',
        contactNumber: '+63 912 555 5555',
        address: '654 Peace Rd, Parish City',
        parentGuardian: 'Rosa Dela Cruz',
        parentContact: '+63 912 555 5556',
        serverLevel: 'JUNIOR' as const,
        memberStatus: 'ACTIVE' as const,
        trainedFor: ['Sunday Mass'],
        school: 'Parish Middle School',
      }
    ];

    for (const memberData of sampleMembers) {
      const existingMember = await prisma.member.findFirst({
        where: {
          OR: [
            { memberId: memberData.memberId },
            { email: memberData.email }
          ]
        }
      });

      if (!existingMember) {
        const hashedPassword = await bcrypt.hash('member123', 12);
        
        await prisma.member.create({
          data: {
            ...memberData,
            hashedPassword: hashedPassword,
            createdByUserId: adminUser.id,
          },
        });
        console.log(`✅ Created member: ${memberData.name} (${memberData.memberId})`);
      } else {
        console.log(`⏭️ Member "${memberData.name}" already exists, skipping...`);
      }
    }

    // 4. Create Sample Events
    console.log('📅 Creating sample events...');
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    const sampleEvents = [
      {
        title: 'Sunday Mass - 8:00 AM',
        description: 'Regular Sunday morning mass service',
        eventType: 'SUNDAY_MASS' as const,
        date: nextWeek,
        startTime: '8:00 AM',
        endTime: '9:30 AM',
        location: 'Main Church',
        requiresAttendance: true,
        minServerLevel: 'JUNIOR' as const,
        status: 'SCHEDULED' as const,
      },
      {
        title: 'Monthly Ministry Meeting',
        description: 'Regular monthly meeting for all altar servers',
        eventType: 'MEETING' as const,
        date: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 15),
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        location: 'Parish Hall',
        requiresAttendance: true,
        status: 'SCHEDULED' as const,
      },
      {
        title: 'Ash Wednesday Mass',
        description: 'Special Lenten season mass service',
        eventType: 'HOLY_DAY' as const,
        date: new Date(2026, 1, 17), // February 17, 2026
        startTime: '6:00 PM',
        endTime: '7:30 PM',
        location: 'Main Church',
        requiresAttendance: true,
        minServerLevel: 'SENIOR' as const,
        status: 'SCHEDULED' as const,
      },
      {
        title: 'Altar Server Training Session',
        description: 'Training for new junior altar servers',
        eventType: 'TRAINING' as const,
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        location: 'Church Sacristy',
        requiresAttendance: false,
        maxParticipants: 10,
        status: 'SCHEDULED' as const,
      }
    ];

    for (const eventData of sampleEvents) {
      const existingEvent = await prisma.event.findFirst({
        where: {
          title: eventData.title,
          date: eventData.date
        }
      });

      if (!existingEvent) {
        await prisma.event.create({
          data: {
            ...eventData,
            createdByUserId: adminUser.id,
          },
        });
        console.log(`✅ Created event: ${eventData.title}`);
      } else {
        console.log(`⏭️ Event "${eventData.title}" already exists, skipping...`);
      }
    }

    // 5. Create Sample Notifications
    console.log('🔔 Creating sample notifications...');
    
    const sampleNotifications = [
      {
        title: 'Welcome to Ministry Management',
        message: 'Welcome to the Ministry of Altar Servers Management System! This platform will help you track attendance, manage events, and stay connected with our ministry.',
        type: 'ANNOUNCEMENT' as const,
        priority: 'NORMAL' as const,
        targetType: 'ALL_MEMBERS' as const,
      },
      {
        title: 'Monthly Dues Reminder',
        message: 'Friendly reminder: Monthly dues for January are now due. Please submit your payment of ₱100 to the ministry coordinator.',
        type: 'DUES_REMINDER' as const,
        priority: 'HIGH' as const,
        targetType: 'ALL_MEMBERS' as const,
      },
      {
        title: 'Upcoming Training Session',
        message: 'New altar server training session scheduled for next week. All junior servers are encouraged to attend.',
        type: 'EVENT_REMINDER' as const,
        priority: 'NORMAL' as const,
        targetType: 'ACTIVE_MEMBERS_ONLY' as const,
      }
    ];

    for (const notificationData of sampleNotifications) {
      const existingNotification = await prisma.notification.findFirst({
        where: { title: notificationData.title }
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: notificationData,
        });
        console.log(`✅ Created notification: ${notificationData.title}`);
      } else {
        console.log(`⏭️ Notification "${notificationData.title}" already exists, skipping...`);
      }
    }

    console.log('\n🎉 Ministry seeding completed successfully!');
    
    // Display summary
    const memberCount = await prisma.member.count();
    const eventCount = await prisma.event.count();
    const notificationCount = await prisma.notification.count();

    console.log('\n📊 Ministry Database Summary:');
    console.log(`👥 Members: ${memberCount}`);
    console.log(`📅 Events: ${eventCount}`);
    console.log(`🔔 Notifications: ${notificationCount}`);
    console.log(`⚙️ Ministry Settings: Configured`);
    console.log(`👤 Admin User: Created (admin@ministry.com)`);

    console.log('\n🔐 Default Login Credentials:');
    console.log('Admin: admin@ministry.com / admin123');
    console.log('Members: [member-email] / member123');

  } catch (error) {
    console.error('❌ Error seeding ministry data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
if (require.main === module) {
  seedMinistry()
    .then(() => {
      console.log('\n✨ Ministry seeding process completed!');
      console.log('🚀 Your Ministry of Altar Servers Management System is ready to use!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Ministry seeding process failed:', error);
      process.exit(1);
    });
}

export default seedMinistry;