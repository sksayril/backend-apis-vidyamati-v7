const mongoose = require('mongoose');
const AdminUser = require('./models/admin.user.model');

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.xqa99.mongodb.net/vidyabani?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Function to create multiple admin users
async function createMultipleAdminUsers() {
  try {
    const adminUsers = [
      {
        email: 'admin@vidyavani.com',
        password: 'Admin123@',
        role: 'admin'
      },
      {
        email: 'admin1@vidyavani.com',
        password: 'Admin123@',
        role: 'admin'
      },
      {
        email: 'admin2@vidyavani.com',
        password: 'Admin123@',
        role: 'admin'
      },
      {
        email: 'superadmin@vidyavani.com',
        password: 'SuperAdmin123@',
        role: 'admin'
      },
      {
        email: 'manager@vidyavani.com',
        password: 'Manager123@',
        role: 'admin'
      }
    ];

    for (const adminData of adminUsers) {
      // Check if admin already exists
      const existingAdmin = await AdminUser.findOne({ email: adminData.email });
      if (existingAdmin) {
        console.log(`Admin user already exists: ${existingAdmin.email}`);
        continue;
      }

      // Create admin user
      const admin = new AdminUser(adminData);
      await admin.save();
      console.log(`Admin user created successfully: ${admin.email}`);
    }

    console.log('\n=== All Admin Accounts ===');
    const allAdmins = await AdminUser.find({});
    allAdmins.forEach(admin => {
      console.log(`Email: ${admin.email}, Role: ${admin.role}`);
    });

  } catch (err) {
    console.error('Error creating admin users:', err);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the function
createMultipleAdminUsers();
