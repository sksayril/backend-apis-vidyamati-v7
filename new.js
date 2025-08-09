const mongoose = require('mongoose');
const User = require('./models/user.model'); // RegularUser collection
const AdminUser = require('./models/admin.user.model'); // User collection (for admins)

// Connect to MongoDB
mongoose.connect('mongodb+srv://admin:admin@cluster0.xqa99.mongodb.net/vidyabani?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Admin users to create (for admin panel - uses /admin/login endpoint)
const adminUsers = [
  {
    email: 'sksayril123@gmail.com',
    password: 'Sksayril123@'
  },
  {
    email: 'admin@example.com',
    password: 'Admin123@'
  }
];

// Regular users with admin role (for main app - uses /api/users/login endpoint)
const adminRegularUsers = [
  {
    name: 'Super Admin',
    email: 'superadmin@example.com',
    password: 'SuperAdmin123@',
    phone: '1234567891',
    role: 'admin'
  },
  {
    name: 'Admin Manager',
    email: 'adminmanager@example.com',
    password: 'AdminManager123@',
    phone: '9876543210',
    role: 'admin'
  }
];

// Demo users to create
const demoUsers = [
  {
    name: 'John Doe',
    email: 'john.doe@example.com',
    password: 'Demo123@',
    phone: '9123456780',
    role: 'user',
    subscription: {
      isSubscribed: true,
      plan: 'yearly',
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    password: 'Demo123@',
    phone: '9123456781',
    role: 'user',
    subscription: {
      isSubscribed: false,
      plan: 'none'
    }
  },
  {
    name: 'Mike Johnson',
    email: 'mike.johnson@example.com',
    password: 'Demo123@',
    phone: '9123456782',
    role: 'user',
    subscription: {
      isSubscribed: true,
      plan: 'yearly',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
      endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000) // 335 days remaining
    }
  },
  {
    name: 'Sarah Wilson',
    email: 'sarah.wilson@example.com',
    password: 'Demo123@',
    phone: '9123456783',
    role: 'user',
    subscription: {
      isSubscribed: false,
      plan: 'none'
    }
  },
  {
    name: 'David Brown',
    email: 'david.brown@example.com',
    password: 'Demo123@',
    phone: '9123456784',
    role: 'user',
    subscription: {
      isSubscribed: true,
      plan: 'yearly',
      startDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000), // Started 300 days ago
      endDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000) // 65 days remaining
    }
  }
];

// Function to create admin users (for admin panel)
async function createAdminUser(userData) {
  try {
    // Check if admin user already exists
    const existingUser = await AdminUser.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`Admin user already exists: ${userData.email}`);
      return null;
    }

    // Create admin user (password will be hashed automatically by the schema pre-save middleware)
    const user = new AdminUser(userData);
    await user.save();
    console.log(`✅ Admin user created successfully: ${userData.email}`);
    return user;
  } catch (err) {
    console.error(`❌ Error creating admin user ${userData.email}:`, err.message);
    return null;
  }
}

// Function to create regular users (including admin role users)
async function createRegularUser(userData) {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      console.log(`User already exists: ${userData.email}`);
      return null;
    }

    // Create user (password will be hashed automatically by the schema pre-save middleware)
    const user = new User(userData);
    await user.save();
    console.log(`✅ ${userData.role} user created successfully: ${userData.email}`);
    return user;
  } catch (err) {
    console.error(`❌ Error creating user ${userData.email}:`, err.message);
    return null;
  }
}

// Function to create all admin panel users
async function createAdminPanelUsers() {
  console.log('\n🔥 Creating Admin Panel Users (for /admin/login)...');
  console.log('='.repeat(50));
  
  for (const adminData of adminUsers) {
    await createAdminUser(adminData);
  }
}

// Function to create admin users in regular collection
async function createAdminRegularUsers() {
  console.log('\n🔥 Creating Admin Users in Regular Collection (for /api/users/login)...');
  console.log('='.repeat(50));
  
  for (const adminData of adminRegularUsers) {
    await createRegularUser(adminData);
  }
}

// Function to create all demo users
async function createDemoUsers() {
  console.log('\n👥 Creating Demo Users...');
  console.log('='.repeat(50));
  
  for (const userData of demoUsers) {
    await createRegularUser(userData);
  }
}

// Function to display summary
async function displaySummary() {
  try {
    const totalRegularUsers = await User.countDocuments();
    const totalAdminUsers = await AdminUser.countDocuments();
    const totalRegularAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsersOnly = await User.countDocuments({ role: 'user' });
    const subscribedUsers = await User.countDocuments({ 'subscription.isSubscribed': true });
    
    console.log('\n📊 Database Summary:');
    console.log('='.repeat(50));
    console.log(`Total Regular Users (RegularUser collection): ${totalRegularUsers}`);
    console.log(`- Admin Role Users: ${totalRegularAdmins}`);
    console.log(`- Regular Users: ${totalRegularUsersOnly}`);
    console.log(`- Subscribed Users: ${subscribedUsers}`);
    console.log(`Total Admin Panel Users (User collection): ${totalAdminUsers}`);
    
    console.log('\n🔑 Admin Panel Login Credentials (Use: POST /admin/login):');
    console.log('='.repeat(50));
    adminUsers.forEach(admin => {
      console.log(`Email: ${admin.email} | Password: ${admin.password}`);
    });
    
    console.log('\n🔑 Admin Users in Regular App (Use: POST /api/users/login):');
    console.log('='.repeat(50));
    adminRegularUsers.forEach(admin => {
      console.log(`Email: ${admin.email} | Password: ${admin.password}`);
    });
    
    console.log('\n👤 Demo User Login Credentials (Use: POST /api/users/login):');
    console.log('='.repeat(50));
    demoUsers.forEach(user => {
      const subStatus = user.subscription.isSubscribed ? '✅ Subscribed' : '❌ Not Subscribed';
      console.log(`Email: ${user.email} | Password: ${user.password} | ${subStatus}`);
    });
    
  } catch (err) {
    console.error('Error generating summary:', err);
  }
}

// Main function to run the script
async function initializeDatabase() {
  try {
    console.log('🚀 Initializing Database with Admin and Demo Users...');
    console.log('='.repeat(60));
    
    await createAdminPanelUsers();
    await createAdminRegularUsers();
    await createDemoUsers();
    await displaySummary();
    
    console.log('\n✨ Database initialization completed!');
    console.log('\n📝 IMPORTANT NOTES:');
    console.log('='.repeat(50));
    console.log('• Use POST /admin/login for admin panel users');
    console.log('• Use POST /api/users/login for regular app users (including admin role)');
    console.log('• Admin panel users only have email & password fields');
    console.log('• Regular users have full profile fields + subscription data');
    
  } catch (err) {
    console.error('❌ Error during database initialization:', err);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the script
initializeDatabase();