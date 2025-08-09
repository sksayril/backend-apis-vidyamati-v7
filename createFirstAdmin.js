const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user.model');

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.xqa99.mongodb.net/vidyabani?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Function to create the first admin
async function createFirstAdmin() {
  try {
    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Sksayril123@', salt);

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'sksayril123@gmail.com',
      password: hashedPassword,
      phone: '1234567891',
      role: 'admin',
      subscription: {
        isSubscribed: false,
        plan: 'none',
      },
      // Note: parentCategoryId and subCategoryId are not required for admin users
    });

    await admin.save();
    console.log('First admin created successfully:', admin.email);
  } catch (err) {
    console.error('Error creating admin:', err);
    if (err.errors) {
      Object.keys(err.errors).forEach(key => {
        console.error(`${key}: ${err.errors[key].message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createFirstAdmin();