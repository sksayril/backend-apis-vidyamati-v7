const Razorpay = require('razorpay');
const crypto = require('crypto');

// Initialize Razorpay with keys from environment variables
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Yearly subscription amount (₹499)
const YEARLY_PLAN_AMOUNT = 499 * 100; // in paisa

// Create a new customer in Razorpay
exports.createCustomer = async (name, email, phone) => {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact: phone,
    });
    return customer;
  } catch (error) {
    console.error('Error creating Razorpay customer:', error);
    throw error;
  }
};

// Create a subscription
exports.createSubscription = async (customerId) => {
  try {
    const options = {
      plan_id: process.env.RAZORPAY_PLAN_ID, // Plan ID from Razorpay dashboard
      customer_notify: 1,
      total_count: 1, // For yearly billing
      quantity: 1,
      customer_id: customerId,
    };
    
    const subscription = await razorpay.subscriptions.create(options);
    return subscription;
  } catch (error) {
    console.error('Error creating Razorpay subscription:', error);
    throw error;
  }
};

// Create a one-time payment order
exports.createOrder = async (amount, receipt, notes = {}) => {
  try {
    const options = {
      amount: amount || YEARLY_PLAN_AMOUNT, // Amount in paisa
      currency: 'INR',
      receipt,
      notes,
      payment_capture: 1, // Auto-capture payment
    };
    
    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment signature
exports.verifyPaymentSignature = (paymentId, orderId, signature) => {
  try {
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    
    return generatedSignature === signature;
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
};

// Fetch a subscription by ID
exports.fetchSubscription = async (subscriptionId) => {
  try {
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

// Cancel a subscription
exports.cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await razorpay.subscriptions.cancel(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

module.exports.YEARLY_PLAN_AMOUNT = YEARLY_PLAN_AMOUNT;
