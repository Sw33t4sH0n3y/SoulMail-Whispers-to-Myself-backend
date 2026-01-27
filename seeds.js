// seeds.js - Populate database with sample data
//
// NOTE: This script creates test data including "already delivered" letters
// with past dates. We bypass Mongoose validation for these historical letters
// since the validation is designed for real user input, not seeding.

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user');
const Letter = require('./models/letter');

const saltRounds = 12;

/**
 * CREATE LETTER (bypassing validation for seed data)
 *
 * For seeding purposes, we need to create letters with past dates
 * (for "already delivered" test letters). The Letter model validates
 * that new letters must have deliveredAt >= 24 hours in the future,
 * but that validation is for user input, not seed data.
 */
const createLetterForSeed = async (letterData) => {
  const letter = new Letter(letterData);
  // Bypass validation for seed data - allows past dates for "delivered" letters
  return letter.save({ validateBeforeSave: false });
};

// Sample data
const sampleUsers = [
  {
    username: 'alice',
    password: 'Alice123',
    name: 'Alice Johnson',
    email: 'alice@example.com'
  },
  {
    username: 'bob',
    password: 'Bob456',
    name: 'Bob Smith',
    email: 'bob@example.com'
  },
  {
    username: 'charlie',
    password: 'Charlie789i',
    name: 'Charlie Brown',
    email: 'charlie@example.com'
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Letter.deleteMany({});
    console.log('✅ Database cleared');

    // Create users
    console.log('👤 Creating users...');
    const createdUsers = [];

    for (const user of sampleUsers) {
      const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
      const newUser = await User.create({
        username: user.username,
        hashedPassword,
        name: user.name,
        email: user.email
      });
      createdUsers.push(newUser);
      console.log(`  ✅ Created user: ${user.username}`);
    }

    // Create sample letters
    console.log('💌 Creating sample letters...');

    // Alice's letters
    const alice = createdUsers[0];
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30); // 30 days ago

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

    // Use createLetterForSeed for already-delivered letters (past dates)
    const letter1 = await createLetterForSeed({
      user: alice._id,
      title: 'My 30-Day Journey',
      content: 'Dear Alice, I hope you are doing well! This past month has been transformative. Remember to stay focused on your goals and be kind to yourself.',
      mood: '🤩',
      weather: 'Sunny',
      temperature: 72,
      currentSong: 'Good as Hell - Lizzo',
      topHeadLine: 'New Year, New Goals',
      location: 'Home Office',
      goal1: 'Exercise 3 times a week',
      goal2: 'Read 2 books',
      goal3: 'Learn Express.js',
      deliveryInterval: '1month',
      deliveredAt: pastDate,
      isDelivered: true,
      reflections: [
        {
          reflection: 'Reading this back, I am amazed at how much I have accomplished. I stayed consistent with exercise and actually read 3 books instead of 2! The Express.js learning is going great. Very proud of myself!'
        },
        {
          reflection: 'One thing I wish I did better was getting more sleep. Need to work on that next month.'
        }
      ]
    });
    console.log('  ✅ Created delivered letter with reflections for Alice');

    const letter2 = await Letter.create({
      user: alice._id,
      title: 'My Next 30 Days - New Goals',
      content: 'Dear Future Alice, Here are my goals for the next month: Complete my Node.js backend project, maintain exercise routine, and start meditation.',
      mood: '🙏',
      weather: 'Cloudy',
      temperature: 68,
      currentSong: 'Don\'t Give Up - Peter Gabriel',
      topHeadLine: 'Tech Industry Booming',
      location: 'Workspace',
      goal1: 'Complete backend project',
      goal2: 'Meditate daily',
      goal3: 'Network with 5 developers',
      deliveryInterval: '1month',
      deliveredAt: futureDate,
      isDelivered: false,
      reflections: []
    });
    console.log('  ✅ Created undelivered letter for Alice');

    // Bob's letters
    const bob = createdUsers[1];
    const oneWeekFuture = new Date();
    oneWeekFuture.setDate(oneWeekFuture.getDate() + 7);

    const letter3 = await Letter.create({
      user: bob._id,
      title: 'Weekend Reflection',
      content: 'Had an amazing weekend. Hiked a new trail, cooked a great meal, and spent time with loved ones. Feeling grateful for life\'s simple pleasures.',
      mood: '😢',
      weather: 'Rainy',
      temperature: 55,
      currentSong: 'Sanctuary - Joji',
      topHeadLine: 'Economy Improving',
      location: 'Mountain Trail',
      goal1: 'Stay healthy',
      goal2: 'Spend quality time with family',
      goal3: 'Explore new places',
      deliveryInterval: '1week',
      deliveredAt: oneWeekFuture,
      isDelivered: false,
      reflections: []
    });
    console.log('  ✅ Created upcoming letter for Bob');

    // Charlie's letters
    const charlie = createdUsers[2];
    const sixMonthsFuture = new Date();
    sixMonthsFuture.setMonth(sixMonthsFuture.getMonth() + 6);

    const letter4 = await Letter.create({
      user: charlie._id,
      title: 'Long-Term Vision',
      content: 'Six months from now, I hope to see significant progress in my career. I want to be promoted to senior developer and have led at least two major projects.',
      mood: '🤩',
      weather: 'Sunny',
      temperature: 75,
      currentSong: 'Walking on Sunshine - Katrina & The Waves',
      topHeadLine: 'AI Revolution Continues',
      location: 'Office',
      goal1: 'Get promoted to senior',
      goal2: 'Lead a major project',
      goal3: 'Mentor junior developers',
      deliveryInterval: '6months',
      deliveredAt: sixMonthsFuture,
      isDelivered: false,
      reflections: []
    });
    console.log('  ✅ Created 6-month future letter for Charlie');

    // Use createLetterForSeed for already-delivered letters (past dates)
    const letter5 = await createLetterForSeed({
      user: charlie._id,
      title: 'A Year of Growth',
      content: 'Looking back on the past year - what an incredible journey! I\'ve learned so much, grown as a person and professional.',
      mood: '☺️',
      weather: 'Clear',
      temperature: 70,
      currentSong: 'All the Stars - Kendrick Lamar',
      topHeadLine: 'Education Innovation Awards',
      location: 'Tech Conference',
      goal1: 'Continuous learning',
      goal2: 'Build meaningful relationships',
      goal3: 'Contribute to open source',
      deliveryInterval: '1year',
      deliveredAt: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // 1 year ago
      isDelivered: true,
      reflections: [
        {
          reflection: 'Amazing! I actually accomplished all my goals and more. This practice of writing letters to myself is incredibly powerful.'
        }
      ]
    });
    console.log('  ✅ Created past year letter for Charlie with reflection');

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`  • Users created: ${createdUsers.length}`);
    console.log(`  • Letters created: 5`);
    console.log(`  • Delivered letters: 2`);
    console.log(`  • Pending letters: 3`);
    console.log('\n🔑 Test Credentials:');
    sampleUsers.forEach(user => {
      console.log(`  • ${user.username} / ${user.password}`);
    });
    console.log('\n💡 Next steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Sign in with any test credential above');
    console.log('  3. Check the docs: POSTMAN_TESTING.md or REACT_ENDPOINTS.md');
    console.log('\n');

    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seeding function
seedDatabase();
