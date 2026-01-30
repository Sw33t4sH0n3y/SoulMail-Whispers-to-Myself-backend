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
    email: 'alice@example.com',
    birthday: new Date('1995-06-15'), // Summer birthday
    settings: {
      celebrationsEnabled: true,
      birthdayOomph: true,
      milestoneOomph: false, // Mixed settings
      anniversaryOomph: true,
      letterDeliveryOomph: true,
      goalAccomplishedOomph: true,
      streakOomph: false
    },
    stats: {
      totalLetters: 8,
      totalReflections: 5,
      currentStreak: 4,
      longestStreak: 12,
      goalsAccomplished: 3
    }
  },
  {
    username: 'bob',
    password: 'Bob456',
    name: 'Bob Smith',
    email: 'bob@example.com',
    birthday: null, // No birthday set
    settings: {
      celebrationsEnabled: true,
      birthdayOomph: true,
      milestoneOomph: true,
      anniversaryOomph: true,
      letterDeliveryOomph: true,
      goalAccomplishedOomph: true,
      streakOomph: true
    },
    stats: {
      totalLetters: 2,
      totalReflections: 0,
      currentStreak: 1,
      longestStreak: 1,
      goalsAccomplished: 0
    }
  },
  {
    username: 'charlie',
    password: 'Charlie789i',
    name: 'Charlie Brown',
    email: 'charlie@example.com',
    birthday: new Date('1988-11-20'), // Fall birthday
    settings: {
      celebrationsEnabled: true,
      birthdayOomph: true,
      milestoneOomph: true,
      anniversaryOomph: true,
      letterDeliveryOomph: true,
      goalAccomplishedOomph: true,
      streakOomph: true
    },
    stats: {
      totalLetters: 25,
      totalReflections: 18,
      currentStreak: 2,
      longestStreak: 15,
      goalsAccomplished: 8
    }
  },
  {
    username: 'diana',
    password: 'Diana123',
    name: 'Diana Prince',
    email: 'diana@example.com',
    birthday: new Date('1990-03-22'), // Spring birthday
    settings: {
      celebrationsEnabled: true,
      birthdayOomph: true,
      milestoneOomph: true,
      anniversaryOomph: true,
      letterDeliveryOomph: true,
      goalAccomplishedOomph: true,
      streakOomph: true
    },
    stats: {
      totalLetters: 50,
      totalReflections: 45,
      currentStreak: 21,
      longestStreak: 30,
      goalsAccomplished: 12
    }
  },
  {
    username: 'eve',
    password: 'Eve2024',
    name: 'Eve Martinez',
    email: 'eve@example.com',
    birthday: new Date('1992-09-08'),
    settings: {
      celebrationsEnabled: false, // All celebrations disabled
      birthdayOomph: false,
      milestoneOomph: false,
      anniversaryOomph: false,
      letterDeliveryOomph: false,
      goalAccomplishedOomph: false,
      streakOomph: false
    },
    stats: {
      totalLetters: 6,
      totalReflections: 3,
      currentStreak: 0,
      longestStreak: 5,
      goalsAccomplished: 2
    }
  },
  {
    username: 'frank',
    password: 'Frank456',
    name: 'Frank Chen',
    email: 'frank@example.com',
    birthday: new Date('1993-02-10'), // Upcoming birthday (Feb)
    settings: {
      celebrationsEnabled: true,
      birthdayOomph: true,
      milestoneOomph: true,
      anniversaryOomph: false,
      letterDeliveryOomph: true,
      goalAccomplishedOomph: false,
      streakOomph: true
    },
    stats: {
      totalLetters: 12,
      totalReflections: 7,
      currentStreak: 5,
      longestStreak: 8,
      goalsAccomplished: 4
    }
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
        email: user.email,
        birthday: user.birthday,
        settings: user.settings,
        stats: user.stats
      });
      createdUsers.push(newUser);
      console.log(`  ✅ Created user: ${user.username}`);
    }

    // Create sample letters
    console.log('💌 Creating sample letters...');

    // Helper: Get users by index
    const alice = createdUsers[0];
    const bob = createdUsers[1];
    const charlie = createdUsers[2];
    const diana = createdUsers[3];
    const eve = createdUsers[4];
    const frank = createdUsers[5];

    // Date helpers
    const pastWeek = new Date();
    pastWeek.setDate(pastWeek.getDate() - 7);

    const pastMonth = new Date();
    pastMonth.setDate(pastMonth.getDate() - 30);

    const past6Months = new Date();
    past6Months.setMonth(past6Months.getMonth() - 6);

    const pastYear = new Date();
    pastYear.setFullYear(pastYear.getFullYear() - 1);

    const futureWeek = new Date();
    futureWeek.setDate(futureWeek.getDate() + 7);

    const futureMonth = new Date();
    futureMonth.setDate(futureMonth.getDate() + 30);

    const future6Months = new Date();
    future6Months.setMonth(future6Months.getMonth() + 6);

    const futureYear = new Date();
    futureYear.setFullYear(futureYear.getFullYear() + 1);

    const customDate = new Date('2026-12-25'); // Christmas 2026

    // alice's letters (mood: 🤩, 🙏, 😰)

    // Letter 1: Alice - Delivered, 1month interval, mood 🤩
    const aliceLetter1 = await createLetterForSeed({
      user: alice._id,
      title: 'My 30-Day Journey',
      content: 'Dear Alice, I hope you are doing well! This past month has been transformative. Remember to stay focused on your goals and be kind to yourself. I have been feeling a bit stressed about work, but the exercise is helping me manage it.',
      mood: '🤩',
      weather: 'Sunny',
      temperature: 72,
      currentSong: 'Good as Hell - Lizzo',
      song: {
        trackName: 'Good as Hell',
        artistName: 'Lizzo',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/7f/d4/43/7fd443a8-861d-dd70-27a1-f23e221883dc/075679905956.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/89/6c/a2/896ca254-3673-f66d-261c-30644eb5004a/mzaf_12055454568932010560.plus.aac.p.m4a'
      },
      topHeadLine: 'New Year, New Goals',
      location: 'Home Office',
      deliveryInterval: '1month',
      deliveredAt: pastMonth,
      isDelivered: true,
      goals: [
        {
          text: 'Exercise 3 times a week',
          status: 'accomplished',
          reflection: 'I actually managed to go 4 times a week! Dedicated morning runs really helped.'
        },
        {
          text: 'Read 2 books',
          status: 'accomplished',
          reflection: 'Read "Atomic Habits" and "Deep Work".'
        },
        {
          text: 'Learn Express.js',
          status: 'inProgress',
          reflection: 'Still working on the middleware concepts, but making good progress.'
        }
      ],
      reflections: [
        {
          reflection: 'Reading this back, I am amazed at how much I have accomplished. I stayed consistent with exercise and actually read 3 books instead of 2! The Express.js learning is going great. Very proud of myself! I definitely feel less stressed now than when I wrote this.'
        },
        {
          reflection: 'One thing I wish I did better was getting more sleep. Need to work on that next month.'
        }
      ]
    });
    console.log('  ✅ Created letter: Alice - 1month delivered (🤩)');

    // Letter 2: Alice - Future, 1month interval, mood 🙏
    const aliceLetter2 = await Letter.create({
      user: alice._id,
      title: 'My Next 30 Days - New Goals',
      content: 'Dear Future Alice, Here are my goals for the next month: Complete my Node.js backend project, maintain exercise routine, and start meditation. I want to feel more centered and less reactive.',
      mood: '🙏',
      weather: 'Cloudy',
      temperature: 68,
      currentSong: 'Don\'t Give Up - Peter Gabriel',
      song: {
        trackName: 'Don\'t Give Up (feat. Kate Bush)',
        artistName: 'Peter Gabriel',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/29/d7/7d/29d77d60-24b8-f45b-936f-d8cf3ce52d8d/884108003503.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/66/f5/8c/66f58c1f-0b7a-bbe0-d024-f7de51305d85/mzaf_12366906422696645368.plus.aac.p.m4a'
      },
      topHeadLine: 'Tech Industry Booming',
      location: 'Workspace',
      deliveryInterval: '1month',
      deliveredAt: futureMonth,
      isDelivered: false,
      goals: [
        { text: 'Complete backend project', status: 'pending' },
        { text: 'Meditate daily', status: 'pending' },
        { text: 'Network with 5 developers', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Alice - 1month future (🙏)');

    // Letter 3: Alice - Future, 1week interval, mood 😰
    const aliceLetter3 = await Letter.create({
      user: alice._id,
      title: 'Dealing with Anxiety',
      content: 'I have been feeling anxious about the upcoming presentation. I need to remember to breathe and trust in my preparation. Future me, I hope you handled this with grace.',
      mood: '😰',
      weather: 'Stormy',
      temperature: 60,
      currentSong: 'Breathe Me - Sia',
      song: {
        trackName: 'Breathe Me',
        artistName: 'Sia',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/68/fd/a8/68fda820-dbb9-d9d1-3c81-c9822e43e4fd/00094634810357.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/31/8a/cb/318acbb2-3fd1-3456-8b75-259ade2897c2/mzaf_4431027103322451782.plus.aac.p.m4a'
      },
      topHeadLine: 'Mental Health Awareness Week',
      location: 'Bedroom',
      deliveryInterval: '1week',
      deliveredAt: futureWeek,
      isDelivered: false,
      goals: [
        { text: 'Practice breathing exercises', status: 'pending' },
        { text: 'Rehearse presentation 3 times', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Alice - 1week future (😰)');

    // bob's letters (mood: 😢, empty)

    // Letter 4: Bob - Future, 1week interval, mood 😢
    const bobLetter1 = await Letter.create({
      user: bob._id,
      title: 'Weekend Reflection',
      content: 'Had an amazing weekend. Hiked a new trail, cooked a great meal, and spent time with loved ones. Feeling grateful for life\'s simple pleasures.',
      mood: '😢',
      weather: 'Rainy',
      temperature: 55,
      currentSong: 'Sanctuary - Joji',
      song: {
        trackName: 'Sanctuary',
        artistName: 'Joji',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/91/7c/2b/917c2ba3-c97c-2807-2c18-b7794ebe5310/190296846489.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/31/a5/99/31a599de-751e-e081-8b68-68853fd8c9db/mzaf_17586077395060881000.plus.aac.p.m4a'
      },
      topHeadLine: 'Economy Improving',
      location: 'Mountain Trail',
      deliveryInterval: '1week',
      deliveredAt: futureWeek,
      isDelivered: false,
      goals: [
        { text: 'Stay healthy', status: 'pending' },
        { text: 'Spend quality time with family', status: 'pending' },
        { text: 'Explore new places', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Bob - 1week future (😢)');

    // Letter 5: Bob - Delivered, customDate interval, no mood
    const bobLetter2 = await createLetterForSeed({
      user: bob._id,
      title: 'First Letter Ever',
      content: 'This is my first time writing to my future self. I am not sure what to expect, but I am excited to see where I will be in a few weeks.',
      mood: '',
      weather: 'Partly Cloudy',
      temperature: 65,
      currentSong: 'Here Comes the Sun - The Beatles',
      song: {
        trackName: 'Here Comes the Sun',
        artistName: 'The Beatles',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/df/db/61/dfdb615d-47f8-06e9-9533-b96daccc029f/18UMGIM31076.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/e7/bf/a0/e7bfa041-6e35-be4e-276e-df489781b5d4/mzaf_1668350712755343495.plus.aac.p.m4a'
      },
      topHeadLine: 'Spring Has Arrived',
      location: 'Park Bench',
      deliveryInterval: 'custom',
      deliveredAt: pastWeek,
      isDelivered: true,
      goals: [
        { text: 'Write more letters', status: 'accomplished', reflection: 'I did it!' }
      ],
      reflections: [
        {
          reflection: 'Wow, reading this brings back memories. I am glad I started this journey.'
        }
      ]
    });
    console.log('  ✅ Created letter: Bob - customDate delivered (no mood)');

    // charlie's letters (mood: ☺️, 🤩, 😫)

    // Letter 6: Charlie - Future, 6months interval, mood 🤩
    const charlieLetter1 = await Letter.create({
      user: charlie._id,
      title: 'Long-Term Vision',
      content: 'Six months from now, I hope to see significant progress in my career. I want to be promoted to senior developer and have led at least two major projects. I am excited about the possibilities!',
      mood: '🤩',
      weather: 'Sunny',
      temperature: 75,
      currentSong: 'Walking On Sunshine - Katrina and the Waves',
      song: {
        trackName: 'Walking On Sunshine',
        artistName: 'Katrina and the Waves',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/cc/0b/bd/cc0bbd86-f930-2f01-1e7d-47574fc36723/13ULAIM49572.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/25/8e/a1/258ea10c-5a35-d63e-54e2-0b2c01b87b9e/mzaf_14823141143295616814.plus.aac.p.m4a'
      },
      topHeadLine: 'AI Revolution Continues',
      location: 'Office',
      deliveryInterval: '6months',
      deliveredAt: future6Months,
      isDelivered: false,
      goals: [
        { text: 'Get promoted to senior', status: 'pending' },
        { text: 'Lead a major project', status: 'pending' },
        { text: 'Mentor junior developers', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Charlie - 6months future (🤩)');

    // Letter 7: Charlie - Delivered, 1year interval, mood ☺️
    const charlieLetter2 = await createLetterForSeed({
      user: charlie._id,
      title: 'A Year of Growth',
      content: 'Looking back on the past year - what an incredible journey! I\'ve learned so much, grown as a person and professional. It has been tough at times, but worth it.',
      mood: '☺️',
      weather: 'Clear',
      temperature: 70,
      currentSong: 'All The Stars - Kendrick Lamar, SZA',
      song: {
        trackName: 'All The Stars',
        artistName: 'Kendrick Lamar, SZA',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/4d/16/55/4d165549-3d11-86dc-fcbf-be7fe0bcadfb/18UMGIM00002.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/ea/8b/2c/ea8b2cf4-95f2-b0b3-ffc5-10f4611bf98f/mzaf_6758805407695014001.plus.aac.p.m4a'
      },
      topHeadLine: 'Education Innovation Awards',
      location: 'Tech Conference',
      deliveryInterval: '1year',
      deliveredAt: pastYear,
      isDelivered: true,
      goals: [
        { text: 'Continuous learning', status: 'accomplished', reflection: 'Took 3 courses this year.' },
        { text: 'Build meaningful relationships', status: 'accomplished', reflection: 'Made 2 new close friends.' },
        { text: 'Contribute to open source', status: 'abandoned', reflection: 'Did not have time.' }
      ],
      reflections: [
        {
          reflection: 'Amazing! I actually accomplished most of my goals. This practice of writing letters to myself is incredibly powerful.'
        }
      ]
    });
    console.log('  ✅ Created letter: Charlie - 1year delivered (☺️)');

    // Letter 8: Charlie - Delivered, 6months interval, mood 😫 (for carry forward demo)
    const charlieLetter3 = await createLetterForSeed({
      user: charlie._id,
      title: 'Burnout Recovery',
      content: 'I have been working too hard and feeling burned out. I need to remember to take breaks and prioritize my health over work.',
      mood: '😫',
      weather: 'Overcast',
      temperature: 62,
      currentSong: 'The Perfect Pair - beabadoobee',
      song: {
        trackName: 'The Perfect Pair',
        artistName: 'beabadoobee',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/39/cb/28/39cb28c2-f48d-5e69-1469-592a7ac1dd11/192641938047_Cover.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/5c/b1/2e/5cb12e2a-0591-cfe3-58e1-397522db385e/mzaf_17061270472463035816.plus.aac.p.m4a'
      },
      topHeadLine: 'Workplace Wellness Initiatives',
      location: 'Home',
      deliveryInterval: '6months',
      deliveredAt: past6Months,
      isDelivered: true,
      goals: [
        { text: 'Take a vacation', status: 'accomplished', reflection: 'Went to Hawaii for 2 weeks!' },
        { text: 'Set work boundaries', status: 'inProgress', reflection: 'Getting better at saying no.' },
        { text: 'Start therapy', status: 'carriedForward', carriedForwardTo: charlieLetter1._id }
      ],
      reflections: [
        {
          reflection: 'I am so glad I took that vacation. I feel recharged and ready to tackle new challenges.'
        }
      ]
    });
    // Update the carried forward goal in charlieLetter1
    charlieLetter1.goals.push({
      text: 'Start therapy',
      status: 'pending',
      carriedForwardFrom: charlieLetter3._id
    });
    await charlieLetter1.save();
    console.log('  ✅ Created letter: Charlie - 6months delivered (😫) with carried goal');

    // diana's letters (power user)

    // Letter 9: Diana - Delivered, 1week interval, mood 🙏
    const dianaLetter1 = await createLetterForSeed({
      user: diana._id,
      title: 'Weekly Retrospective',
      content: 'Another busy week. I am feeling grateful for my supportive team at work. The project launch was successful, and we celebrated with a team dinner. I want to remember this feeling of accomplishment.',
      mood: '🙏',
      weather: 'Windy',
      temperature: 65,
      currentSong: 'Celebration (Single Version) - Kool & The Gang',
      song: {
        trackName: 'Celebration (Single Version)',
        artistName: 'Kool & The Gang',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/ad/28/93/ad2893b3-364e-70d4-96df-e991092fc562/06UMGIM01158.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/f5/87/b1/f587b10e-c15d-f0fb-89f4-f1933b7bf130/mzaf_1574793224397530269.plus.aac.p.m4a'
      },
      topHeadLine: 'Local Team Wins Championship',
      location: 'Downtown Cafe',
      deliveryInterval: '1week',
      deliveredAt: pastWeek,
      isDelivered: true,
      goals: [
        {
          text: 'Launch Project X',
          status: 'accomplished',
          reflection: 'Launch went smoother than expected. No critical bugs!'
        },
        {
          text: 'Mentor junior dev',
          status: 'inProgress',
          reflection: 'Had two sessions this week. They are improving fast.'
        }
      ],
      reflections: [
        {
          reflection: 'This was a great week. I am proud of the team and myself.'
        }
      ]
    });
    console.log('  ✅ Created letter: Diana - 1week delivered (🙏)');

    // Letter 10: Diana - Future, 1year interval, mood 🤩
    const dianaLetter2 = await Letter.create({
      user: diana._id,
      title: 'One Year Vision',
      content: 'In one year, I want to have launched my own startup. I am excited about the journey ahead and all the learning that will come with it.',
      mood: '🤩',
      weather: 'Sunny',
      temperature: 78,
      currentSong: 'Eye of the Tiger - Survivor',
      song: {
        trackName: 'Eye of the Tiger',
        artistName: 'Survivor',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f9/02/8f/f9028f63-7a55-235e-f789-1e8946430fa2/614223201122.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/fe/fa/9e/fefa9edd-c023-4d1c-1012-08bfb0ec69e6/mzaf_4651653238471209843.plus.aac.p.m4a'
      },
      topHeadLine: 'Startup Funding Hits Record High',
      location: 'Co-working Space',
      deliveryInterval: '1year',
      deliveredAt: futureYear,
      isDelivered: false,
      goals: [
        { text: 'Build MVP', status: 'pending' },
        { text: 'Raise seed funding', status: 'pending' },
        { text: 'Hire first employee', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Diana - 1year future (🤩)');

    // eve's letters (celebrations disabled)

    // Letter 11: Eve - Delivered, 1month interval, mood ☺️
    const eveLetter1 = await createLetterForSeed({
      user: eve._id,
      title: 'Simple Joys',
      content: 'I have been focusing on the simple things in life. A good cup of coffee, a walk in nature, and time with friends. These are what matter most.',
      mood: '☺️',
      weather: 'Sunny',
      temperature: 70,
      currentSong: 'Three Little Birds - Bob Marley & The Wailers',
      song: {
        trackName: 'Three Little Birds',
        artistName: 'Bob Marley & The Wailers',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/3c/c2/0d/3cc20dcc-8f4e-f060-36dd-7de52a7ec8fe/12UMGIM14712.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/58/a7/97/58a7977f-66a0-e80b-b3a5-e810cdf41cf5/mzaf_8691301290079134697.plus.aac.p.m4a'
      },
      topHeadLine: 'Happiness Study Released',
      location: 'Coffee Shop',
      deliveryInterval: '1month',
      deliveredAt: pastMonth,
      isDelivered: true,
      goals: [
        { text: 'Practice gratitude daily', status: 'accomplished', reflection: 'Kept a gratitude journal.' },
        { text: 'Disconnect from social media', status: 'accomplished', reflection: 'Deleted apps for a month.' }
      ],
      reflections: [
        {
          reflection: 'This month was peaceful. I feel more present and content.'
        }
      ]
    });
    console.log('  ✅ Created letter: Eve - 1month delivered (☺️)');

    // Letter 12: Eve - Future, customDate interval, mood 😰
    const eveLetter2 = await Letter.create({
      user: eve._id,
      title: 'Holiday Anxiety',
      content: 'The holidays are coming up and I am feeling anxious about family gatherings. I need to set boundaries and take care of myself.',
      mood: '😰',
      weather: 'Cold',
      temperature: 45,
      currentSong: 'Let It Be - The Beatles',
      song: {
        trackName: 'Let It Be',
        artistName: 'The Beatles',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music124/v4/ae/98/4c/ae984c7a-cd06-a7cd-e8bf-32cb15ba698d/00602567705475.rgb.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/0f/f7/e1/0ff7e145-6be6-4341-4fa1-32999d20707f/mzaf_15493778815944217662.plus.aac.p.m4a'
      },
      topHeadLine: 'Holiday Shopping Season Begins',
      location: 'Home',
      deliveryInterval: 'custom',
      deliveredAt: customDate,
      isDelivered: false,
      goals: [
        { text: 'Set clear boundaries', status: 'pending' },
        { text: 'Plan self-care activities', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Eve - customDate future (😰)');

    // frank's letters (upcoming birthday)

    // Letter 13: Frank - Delivered, 1month interval, mood 😫
    const frankLetter1 = await createLetterForSeed({
      user: frank._id,
      title: 'Feeling Overwhelmed',
      content: 'Work has been overwhelming lately. Too many deadlines, too little time. I need to learn to delegate and ask for help.',
      mood: '😫',
      weather: 'Rainy',
      temperature: 58,
      currentSong: 'Stressed Out - twenty one pilots',
      song: {
        trackName: 'Stressed Out',
        artistName: 'twenty one pilots',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8e/e2/89/8ee28904-0821-610d-5011-a61845f62756/075679926951.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview221/v4/a9/74/e8/a974e8f2-0693-9371-bb6c-87047a486254/mzaf_1898989387861959316.plus.aac.p.m4a'
      },
      topHeadLine: 'Workplace Stress on the Rise',
      location: 'Office',
      deliveryInterval: '1month',
      deliveredAt: pastMonth,
      isDelivered: true,
      goals: [
        { text: 'Delegate 2 tasks', status: 'accomplished', reflection: 'Delegated successfully!' },
        { text: 'Ask manager for support', status: 'accomplished', reflection: 'Had a great conversation.' },
        { text: 'Take a mental health day', status: 'abandoned', reflection: 'Too busy to take time off.' }
      ],
      reflections: [
        {
          reflection: 'I am glad I reached out for help. Things are more manageable now.'
        }
      ]
    });
    console.log('  ✅ Created letter: Frank - 1month delivered (😫)');

    // Letter 14: Frank - Future, 6months interval, mood 🙏
    const frankLetter2 = await Letter.create({
      user: frank._id,
      title: 'Career Pivot',
      content: 'I am considering a career change. I want to move into product management. This is scary but exciting.',
      mood: '🙏',
      weather: 'Clear',
      temperature: 72,
      currentSong: 'Changes - David Bowie',
      song: {
        trackName: 'Changes',
        artistName: 'David Bowie',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/f0/b9/68/f0b9680e-b028-b3d6-f793-7c268256499a/825646286034.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/3b/a8/19/3ba81905-f12c-299c-0efd-fcfe43558c22/mzaf_15463370320544172076.plus.aac.p.m4a'
      },
      topHeadLine: 'Career Transitions Becoming More Common',
      location: 'Library',
      deliveryInterval: '6months',
      deliveredAt: future6Months,
      isDelivered: false,
      goals: [
        { text: 'Complete PM certification', status: 'pending' },
        { text: 'Network with PMs', status: 'pending' },
        { text: 'Apply to 5 PM roles', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Frank - 6months future (🙏)');

    // Letter 15: Frank - Future, 1week interval, mood 😢
    const frankLetter3 = await Letter.create({
      user: frank._id,
      title: 'Missing Home',
      content: 'I have been feeling homesick lately. I miss my family and friends back home. I need to plan a visit soon.',
      mood: '😢',
      weather: 'Foggy',
      temperature: 55,
      currentSong: 'Homeward Bound - Simon & Garfunkel',
      song: {
        trackName: 'Homeward Bound',
        artistName: 'Simon & Garfunkel',
        artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/06/f4/d2/06f4d208-642e-75c0-d905-1ac98e7d441c/886447797075.jpg/100x100bb.jpg',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/d4/5a/c1/d45ac181-b72c-7deb-e9f8-b0c7a3e89a8b/mzaf_5832581675078762687.plus.aac.p.m4a'
      },
      topHeadLine: 'Travel Restrictions Eased',
      location: 'Apartment',
      deliveryInterval: '1week',
      deliveredAt: futureWeek,
      isDelivered: false,
      goals: [
        { text: 'Book flight home', status: 'pending' },
        { text: 'Video call family weekly', status: 'pending' }
      ],
      reflections: []
    });
    console.log('  ✅ Created letter: Frank - 1week future (😢)');

    console.log('\n' + '='.repeat(50));
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`  • Users created: ${createdUsers.length}`);
    console.log(`  • Letters created: 15`);
    console.log(`  • Delivered letters: 7`);
    console.log(`  • Pending letters: 8`);
    console.log('\n🎨 Feature Coverage:');
    console.log('  • All moods: ☺️, 😢, 😰, 🤩, 🙏, 😫, (empty)');
    console.log('  • All intervals: 1week, 1month, 6months, 1year, custom');
    console.log('  • All goal statuses: pending, completed, inProgress, abandoned, carriedForward');
    console.log('  • User settings: varied celebration toggles');
    console.log('  • Birthdays: 5 users with birthdays set');
    console.log('  • Songs: All letters include iTunes song metadata with audio preview URLs');
    console.log('\n🔑 Test Credentials:');
    sampleUsers.forEach(user => {
      console.log(`  • ${user.username} / ${user.password}`);
    });
    console.log('\n💡 Next steps:');
    console.log('  1. Start the server: npm run dev');
    console.log('  2. Sign in with any test credential above');
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
