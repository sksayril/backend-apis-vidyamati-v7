const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/\S+@\S+\.\S+/, 'Invalid email format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  phone: {
    type: String,
    trim: true
  },
  parentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Parent category is required']
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Sub category is required']
  },
  subscription: {
    isSubscribed: {
      type: Boolean,
      default: false
    },
    plan: {
      type: String,
      enum: ['yearly', 'none'],
      default: 'none'
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    razorpayCustomerId: {
      type: String
    },
    razorpaySubscriptionId: {
      type: String
    },
    paymentHistory: [{
      razorpayPaymentId: String,
      amount: Number,
      status: String,
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  tokenVersion: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  strict: false
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to check if subscription is active
userSchema.methods.hasActiveSubscription = function() {
  if (!this.subscription.isSubscribed) return false;
  
  const now = new Date();
  return this.subscription.endDate && this.subscription.endDate > now;
};

module.exports = mongoose.model('RegularUser', userSchema);
