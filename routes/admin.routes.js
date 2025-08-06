const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const Category = require('../models/category.model');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin Dashboard Overview
router.get('/api/admin/dashboard/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get active subscriptions
    const activeSubscriptions = await User.countDocuments({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $gt: new Date() }
    });

    // Calculate total revenue
    const usersWithPayments = await User.find({
      'subscription.paymentHistory': { $exists: true, $ne: [] }
    });

    const totalRevenue = usersWithPayments.reduce((total, user) => {
      const payments = user.subscription.paymentHistory || [];
      return total + payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    }, 0);

    // Get new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Calculate subscription rate
    const subscriptionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0;

    // Get recent users
    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get recent payments
    const recentPayments = await User.aggregate([
      { $unwind: '$subscription.paymentHistory' },
      { $sort: { 'subscription.paymentHistory.date': -1 } },
      { $limit: 5 },
      {
        $project: {
          userId: '$_id',
          userName: '$name',
          amount: '$subscription.paymentHistory.amount',
          paymentId: '$subscription.paymentHistory.razorpayPaymentId',
          date: '$subscription.paymentHistory.date'
        }
      }
    ]);

    // Get subscription stats
    const expiredSubscriptions = await User.countDocuments({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $lte: new Date() }
    });

    const cancelledSubscriptions = await User.countDocuments({
      'subscription.isSubscribed': false,
      'subscription.paymentHistory': { $exists: true, $ne: [] }
    });

    res.json({
      analytics: {
        totalUsers,
        activeSubscriptions,
        totalRevenue,
        monthlyRevenue: totalRevenue, // Simplified for now
        newUsersThisMonth,
        subscriptionRate: parseFloat(subscriptionRate),
        averageRevenuePerUser: totalUsers > 0 ? (totalRevenue / totalUsers).toFixed(2) : 0
      },
      recentActivity: {
        newUsers: recentUsers,
        recentPayments
      },
      subscriptionStats: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        cancelled: cancelledSubscriptions,
        pending: 0 // You can implement this based on your business logic
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get All Users (Paginated)
router.get('/api/admin/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const subscription = req.query.subscription || 'all';

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (subscription === 'active') {
      query['subscription.isSubscribed'] = true;
      query['subscription.endDate'] = { $gt: new Date() };
    } else if (subscription === 'inactive') {
      query.$or = [
        { 'subscription.isSubscribed': false },
        { 'subscription.endDate': { $lte: new Date() } }
      ];
    }

    // Get total count
    const totalUsers = await User.countDocuments(query);

    // Get paginated users
    const users = await User.find(query)
      .populate('parentCategoryId', 'name')
      .populate('subCategoryId', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Format response
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      parentCategory: user.parentCategoryId ? {
        id: user.parentCategoryId._id,
        name: user.parentCategoryId.name
      } : null,
      subCategory: user.subCategoryId ? {
        id: user.subCategoryId._id,
        name: user.subCategoryId.name
      } : null,
      subscription: {
        isActive: user.hasActiveSubscription(),
        plan: user.subscription.plan,
        startDate: user.subscription.startDate,
        endDate: user.subscription.endDate
      },
      createdAt: user.createdAt,
      lastLogin: user.updatedAt // Using updatedAt as lastLogin for now
    }));

    res.json({
      users: formattedUsers,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasMore: page * limit < totalUsers
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get User Details
router.get('/api/admin/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('parentCategoryId', 'name')
      .populate('subCategoryId', 'name')
      .select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        parentCategory: user.parentCategoryId ? {
          id: user.parentCategoryId._id,
          name: user.parentCategoryId.name
        } : null,
        subCategory: user.subCategoryId ? {
          id: user.subCategoryId._id,
          name: user.subCategoryId.name
        } : null,
        subscription: {
          isActive: user.hasActiveSubscription(),
          plan: user.subscription.plan,
          startDate: user.subscription.startDate,
          endDate: user.subscription.endDate,
          paymentHistory: user.subscription.paymentHistory || []
        },
        createdAt: user.createdAt,
        lastLogin: user.updatedAt
      }
    });

  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// Update User
router.put('/api/admin/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, phone, parentCategoryId, subCategoryId } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (parentCategoryId) user.parentCategoryId = parentCategoryId;
    if (subCategoryId) user.subCategoryId = subCategoryId;

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete User
router.delete('/api/admin/users/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Revenue Analytics
router.get('/api/admin/analytics/revenue', authenticate, requireAdmin, async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get all payments in the date range
    const usersWithPayments = await User.find({
      'subscription.paymentHistory.date': { $gte: startDate, $lte: endDate }
    });

    // Calculate revenue data
    const revenueData = [];
    const totalRevenue = usersWithPayments.reduce((total, user) => {
      const payments = user.subscription.paymentHistory || [];
      const periodPayments = payments.filter(payment => 
        payment.date >= startDate && payment.date <= endDate
      );
      
      const periodRevenue = periodPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      if (periodRevenue > 0) {
        // Group by month for better data structure
        const monthKey = new Date().toISOString().slice(0, 7);
        revenueData.push({
          date: monthKey,
          revenue: periodRevenue,
          subscriptions: periodPayments.length,
          averageOrderValue: periodRevenue / periodPayments.length
        });
      }
      
      return total + periodRevenue;
    }, 0);

    res.json({
      revenue: {
        total: totalRevenue,
        period,
        data: revenueData,
        growth: {
          percentage: 0, // Calculate based on previous period
          trend: 'up'
        }
      }
    });

  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch revenue analytics' });
  }
});

// User Analytics
router.get('/api/admin/analytics/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const period = req.query.period || 'monthly';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

    // Get total users
    const totalUsers = await User.countDocuments();
    
    // Get active users (users with active subscriptions)
    const activeUsers = await User.countDocuments({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $gt: new Date() }
    });

    // Get new users in date range
    const newUsers = await User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Get category distribution
    const categoryDistribution = await User.aggregate([
      {
        $lookup: {
          from: 'categories',
          localField: 'parentCategoryId',
          foreignField: '_id',
          as: 'parentCategory'
        }
      },
      {
        $group: {
          _id: '$parentCategoryId',
          users: { $sum: 1 },
          categoryName: { $first: { $arrayElemAt: ['$parentCategory.name', 0] } }
        }
      },
      {
        $project: {
          category: '$categoryName',
          users: 1,
          percentage: { $multiply: [{ $divide: ['$users', totalUsers] }, 100] }
        }
      }
    ]);

    res.json({
      userAnalytics: {
        totalUsers,
        activeUsers,
        newUsers,
        growth: {
          percentage: 0, // Calculate based on previous period
          trend: 'up'
        },
        data: [
          {
            date: new Date().toISOString().slice(0, 7),
            newUsers,
            activeUsers,
            totalUsers
          }
        ],
        categoryDistribution
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

// Subscription Analytics
router.get('/api/admin/analytics/subscriptions', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get subscription stats
    const totalSubscriptions = await User.countDocuments({
      'subscription.paymentHistory': { $exists: true, $ne: [] }
    });

    const activeSubscriptions = await User.countDocuments({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $gt: new Date() }
    });

    const expiredSubscriptions = await User.countDocuments({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $lte: new Date() }
    });

    // Calculate monthly recurring revenue
    const usersWithActiveSubscriptions = await User.find({
      'subscription.isSubscribed': true,
      'subscription.endDate': { $gt: new Date() }
    });

    const monthlyRecurringRevenue = usersWithActiveSubscriptions.reduce((total, user) => {
      const payments = user.subscription.paymentHistory || [];
      const latestPayment = payments[payments.length - 1];
      return total + (latestPayment?.amount || 0);
    }, 0);

    // Calculate conversion rate
    const totalUsers = await User.countDocuments();
    const conversionRate = totalUsers > 0 ? ((activeSubscriptions / totalUsers) * 100).toFixed(1) : 0;

    res.json({
      subscriptionAnalytics: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        monthlyRecurringRevenue,
        conversionRate: parseFloat(conversionRate),
        churnRate: 0, // Calculate based on your business logic
        data: [
          {
            month: new Date().toISOString().slice(0, 7),
            newSubscriptions: 0, // Calculate based on your business logic
            cancellations: 0,
            revenue: monthlyRecurringRevenue
          }
        ],
        paymentMethods: {
          razorpay: totalSubscriptions,
          other: 0
        }
      }
    });

  } catch (error) {
    console.error('Subscription analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription analytics' });
  }
});

module.exports = router; 