const mongoose = require('mongoose');
const AdminUser = require('./models/admin.user.model');

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.xqa99.mongodb.net/vidyabani?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Function to create admin user
async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@vidyabani.com' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Create admin user
    const admin = new AdminUser({
      email: 'admin@vidyabani.com',
      password: 'Admin123@',
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully:', admin.email);
    console.log('Login credentials:');
    console.log('Email: admin@vidyabani.com');
    console.log('Password: Admin123@');
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createAdminUser();
