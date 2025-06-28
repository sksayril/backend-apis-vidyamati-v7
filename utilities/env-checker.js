// Environment Variables Checker
// Run this to verify all required environment variables are set

const checkEnvVariables = () => {
  const requiredVars = {
    // Database
    'MONGODB_URI': process.env.MONGODB_URI,
    
    // JWT
    'JWT_SECRET': process.env.JWT_SECRET,
    
    // Razorpay
    'RAZORPAY_KEY_ID': process.env.RAZORPAY_KEY_ID,
    'RAZORPAY_KEY_SECRET': process.env.RAZORPAY_KEY_SECRET,
    'RAZORPAY_PLAN_ID': process.env.RAZORPAY_PLAN_ID,
    
    // AWS S3
    'AWS_ACCESS_KEY_ID': process.env.AWS_ACCESS_KEY_ID,
    'AWS_SECRET_ACCESS_KEY': process.env.AWS_SECRET_ACCESS_KEY,
    'AWS_REGION': process.env.AWS_REGION,
    'AWS_S3_BUCKET': process.env.AWS_S3_BUCKET,
    
    // Gemini AI
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY
  };

  console.log('🔍 Checking Environment Variables...\n');
  
  let allSet = true;
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      console.log(`❌ ${key}: NOT SET`);
      allSet = false;
    } else {
      // Mask sensitive values
      const maskedValue = key.includes('SECRET') || key.includes('KEY') 
        ? value.substring(0, 8) + '...' 
        : value;
      console.log(`✅ ${key}: ${maskedValue}`);
    }
  });

  console.log('\n' + '='.repeat(50));
  
  if (allSet) {
    console.log('🎉 All environment variables are properly set!');
  } else {
    console.log('⚠️  Some environment variables are missing. Please check your .env file.');
    console.log('\n📝 Required variables:');
    Object.keys(requiredVars).forEach(key => {
      if (!requiredVars[key]) {
        console.log(`   - ${key}`);
      }
    });
  }

  return allSet;
};

// Test Razorpay connection
const testRazorpayConnection = async () => {
  try {
    const Razorpay = require('razorpay');
    
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.log('❌ Razorpay credentials not found in environment variables');
      return false;
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Test by fetching account details
    const account = await razorpay.accounts.fetch();
    console.log('✅ Razorpay connection successful!');
    console.log(`   Account: ${account.name}`);
    return true;
  } catch (error) {
    console.log('❌ Razorpay connection failed:');
    console.log(`   Error: ${error.message}`);
    
    if (error.statusCode === 401) {
      console.log('   🔑 This is an authentication error. Please check your API keys.');
    }
    
    return false;
  }
};

// Run checks
const runChecks = async () => {
  console.log('🚀 Environment and Service Health Check\n');
  
  const envOk = checkEnvVariables();
  
  if (envOk) {
    console.log('\n🔗 Testing Razorpay connection...');
    await testRazorpayConnection();
  }
  
  console.log('\n✨ Check complete!');
};

// Export for use in other files
module.exports = {
  checkEnvVariables,
  testRazorpayConnection,
  runChecks
};

// Run if this file is executed directly
if (require.main === module) {
  require('dotenv').config();
  runChecks();
} 