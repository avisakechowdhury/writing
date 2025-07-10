import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Post from '../models/Post.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/daily-writing');
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('Cleared existing data');
    
    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await User.create([
      {
        email: 'john@example.com',
        password: hashedPassword,
        username: 'johnwriter',
        displayName: 'John Writer',
        streak: 5,
        points: 150,
        level: 2,
        totalPosts: 8,
        lastWriteDate: new Date(),
        preferences: {
          isAnonymous: false,
          notifications: true,
          reminderTime: '20:00'
        }
      },
      {
        email: 'jane@example.com',
        password: hashedPassword,
        username: 'janedoe',
        displayName: 'Jane Doe',
        streak: 12,
        points: 320,
        level: 4,
        totalPosts: 15,
        lastWriteDate: new Date(),
        preferences: {
          isAnonymous: true,
          notifications: true,
          reminderTime: '19:00'
        }
      }
    ]);
    
    console.log('Created sample users');
    
    // Create sample posts
    const posts = await Post.create([
      {
        title: 'Finding Peace in Morning Routines',
        content: '<p>There\'s something magical about the quiet hours of the morning. Before the world wakes up, before the notifications start buzzing, there\'s this perfect pocket of time that belongs entirely to me.</p><p>I\'ve been experimenting with different morning routines lately, and I\'ve discovered that it\'s not about having the perfect routine - it\'s about having intention. Whether it\'s journaling, meditation, or simply enjoying a cup of coffee in silence, these moments set the tone for everything that follows.</p>',
        authorId: users[0]._id,
        authorName: users[0].displayName,
        isAnonymous: false,
        likes: 23,
        likedBy: [users[1]._id],
        tags: ['morning', 'routine', 'mindfulness'],
        mood: 'peaceful',
        wordCount: 147
      },
      {
        title: 'The Fear of the Blank Page',
        content: '<p>I\'ve been staring at this blank page for what feels like hours. The cursor blinks mockingly, as if it\'s counting down the seconds until I give up and close the laptop.</p><p>But here\'s the thing about fear - it\'s often louder than it needs to be. The blank page isn\'t empty because I have nothing to say. It\'s empty because I\'m afraid what I have to say isn\'t worth saying.</p>',
        authorId: users[1]._id,
        authorName: 'Anonymous',
        isAnonymous: true,
        likes: 87,
        likedBy: [users[0]._id],
        tags: ['fear', 'writing', 'courage'],
        mood: 'anxious',
        wordCount: 132
      }
    ]);
    
    console.log('Created sample posts');
    
    console.log('Seed data created successfully!');
    console.log('Sample login credentials:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: jane@example.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();