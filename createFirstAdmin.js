const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/user.model'); // Adjust path to your user model

// Connect to MongoDB
mongoose.connect('mongodb://cripcocode:sksayril123@45.129.86.243:27017/adhyanguru?authSource=admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
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
    const hashedPassword = await bcrypt.hash('Sksayril123@', salt); // Replace with a strong password

    // Create admin user
    const admin = new User({
      name: 'Admin User',
      email: 'sksayril123@gmail.com',
      password: hashedPassword,
      phone: '1234567891', // Optional
      role: 'admin',
      subscription: {
        isSubscribed: false,
        plan: 'none',
      },
    });

    await admin.save();
    console.log('First admin created successfully:', admin.email);
  } catch (err) {
    console.error('Error creating admin:', err);
  } finally {
    mongoose.connection.close(); // Close the connection
  }
}

// Run the function
createFirstAdmin();