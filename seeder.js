import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Service from './models/serviceModel.js';
import User from './models/userModel.js';
import connectDB from './config/db.js';

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await Service.deleteMany();
    await User.deleteMany();

    const sampleUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
    });

    const services = [
      {
        name: 'Premium Deep Cleaning',
        category: 'Cleaning',
        description: 'A comprehensive top-to-bottom cleaning of your entire home to make it feel brand new. Ideal for move-in or seasonal cleaning.',
        price: 45,
        rating: 4.9,
        numReviews: 231,
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=2670&auto=format&fit=crop',
      },
      {
        name: 'Smart Home Installation',
        category: 'Electrical',
        description: 'Expert installation of smart thermostats, video doorbells, smart locks, and complete home automation systems.',
        price: 65,
        rating: 4.8,
        numReviews: 124,
        image: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=2670&auto=format&fit=crop',
      },
      {
        name: 'Advanced Plumbing Fix',
        category: 'Plumbing',
        description: 'Fast and reliable solutions for complex plumbing issues, leaks, water heater installations, and pipe replacements.',
        price: 55,
        rating: 4.7,
        numReviews: 89,
        image: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?q=80&w=2670&auto=format&fit=crop',
      },
      {
        name: 'Landscape Maintenance',
        category: 'Gardening',
        price: 40,
        rating: 4.6,
        numReviews: 54,
        image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2670&auto=format&fit=crop',
        description: 'Professional lawn care, tree trimming, and seasonal garden cleanups.',
      },
    ];

    await Service.insertMany(services);
    
    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
