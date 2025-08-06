# Admin Dashboard API Documentation

This document describes the Admin Dashboard API system for managing users, subscriptions, analytics, and content.

## Overview

The Admin Dashboard provides comprehensive management capabilities for:
- **User Management**: View, manage, and analyze user data
- **Subscription Analytics**: Track revenue, subscriptions, and payment history
- **Content Management**: Manage categories, blogs, quizzes, and other content
- **Analytics Dashboard**: Real-time statistics and insights

## Authentication

All admin endpoints require admin authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <admin-jwt-token>
```

## Admin Authentication

### 1. Admin Login

**POST** `/admin/login`

Authenticate admin user and get access token.

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123@"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "admin": {
    "id": "admin_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

## User Management APIs

### 1. Get All Users (Paginated)

**GET** `/api/admin/users`

Get paginated list of all registered users.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name or email
- `subscription`: Filter by subscription status ('active', 'inactive', 'all')

**Response:**
```json
{
  "users": [
    {
      "id": "user_id",
      "name": "User Name",
      "email": "user@example.com",
      "phone": "1234567890",
      "parentCategory": {
        "id": "category_id",
        "name": "Category Name"
      },
      "subCategory": {
        "id": "subcategory_id",
        "name": "Subcategory Name"
      },
      "subscription": {
        "isActive": true,
        "plan": "yearly",
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2025-01-01T00:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLogin": "2024-03-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalUsers": 200,
    "hasMore": true
  }
}
```

### 2. Get User Details

**GET** `/api/admin/users/:userId`

Get detailed information about a specific user.

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "1234567890",
    "parentCategory": {
      "id": "category_id",
      "name": "Category Name"
    },
    "subCategory": {
      "id": "subcategory_id",
      "name": "Subcategory Name"
    },
    "subscription": {
      "isActive": true,
      "plan": "yearly",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2025-01-01T00:00:00.000Z",
      "paymentHistory": [
        {
          "razorpayPaymentId": "pay_123456",
          "amount": 499,
          "status": "success",
          "date": "2024-01-01T00:00:00.000Z"
        }
      ]
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-03-20T10:00:00.000Z"
  }
}
```

### 3. Update User

**PUT** `/api/admin/users/:userId`

Update user information (admin only).

**Request Body:**
```json
{
  "name": "Updated Name",
  "phone": "9876543210",
  "parentCategoryId": "new_category_id",
  "subCategoryId": "new_subcategory_id"
}
```

**Response:**
```json
{
  "message": "User updated successfully",
  "user": {
    "id": "user_id",
    "name": "Updated Name",
    "email": "user@example.com",
    "phone": "9876543210"
  }
}
```

### 4. Delete User

**DELETE** `/api/admin/users/:userId`

Delete a user account (admin only).

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## Analytics & Dashboard APIs

### 1. Dashboard Overview

**GET** `/api/admin/dashboard/overview`

Get comprehensive dashboard analytics.

**Response:**
```json
{
  "analytics": {
    "totalUsers": 1250,
    "activeSubscriptions": 890,
    "totalRevenue": 445110,
    "monthlyRevenue": 45000,
    "newUsersThisMonth": 45,
    "subscriptionRate": 71.2,
    "averageRevenuePerUser": 500.12
  },
  "recentActivity": {
    "newUsers": [
      {
        "id": "user_id",
        "name": "New User",
        "email": "newuser@example.com",
        "createdAt": "2024-03-20T10:00:00.000Z"
      }
    ],
    "recentPayments": [
      {
        "userId": "user_id",
        "userName": "User Name",
        "amount": 499,
        "paymentId": "pay_123456",
        "date": "2024-03-20T10:00:00.000Z"
      }
    ]
  },
  "subscriptionStats": {
    "active": 890,
    "expired": 120,
    "cancelled": 45,
    "pending": 15
  }
}
```

### 2. Revenue Analytics

**GET** `/api/admin/analytics/revenue`

Get detailed revenue analytics with time-based filtering.

**Query Parameters:**
- `period`: Time period ('daily', 'weekly', 'monthly', 'yearly')
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "revenue": {
    "total": 445110,
    "period": "monthly",
    "data": [
      {
        "date": "2024-01",
        "revenue": 45000,
        "subscriptions": 90,
        "averageOrderValue": 500
      },
      {
        "date": "2024-02",
        "revenue": 48000,
        "subscriptions": 96,
        "averageOrderValue": 500
      }
    ],
    "growth": {
      "percentage": 6.67,
      "trend": "up"
    }
  }
}
```

### 3. User Analytics

**GET** `/api/admin/analytics/users`

Get user growth and engagement analytics.

**Query Parameters:**
- `period`: Time period ('daily', 'weekly', 'monthly', 'yearly')
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

**Response:**
```json
{
  "userAnalytics": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "newUsers": 45,
    "growth": {
      "percentage": 3.7,
      "trend": "up"
    },
    "data": [
      {
        "date": "2024-01",
        "newUsers": 40,
        "activeUsers": 850,
        "totalUsers": 1200
      },
      {
        "date": "2024-02",
        "newUsers": 45,
        "activeUsers": 890,
        "totalUsers": 1250
      }
    ],
    "categoryDistribution": [
      {
        "category": "Engineering",
        "users": 450,
        "percentage": 36
      },
      {
        "category": "Medical",
        "users": 380,
        "percentage": 30.4
      }
    ]
  }
}
```

### 4. Subscription Analytics

**GET** `/api/admin/analytics/subscriptions`

Get subscription and payment analytics.

**Response:**
```json
{
  "subscriptionAnalytics": {
    "totalSubscriptions": 890,
    "activeSubscriptions": 850,
    "expiredSubscriptions": 40,
    "monthlyRecurringRevenue": 45000,
    "conversionRate": 71.2,
    "churnRate": 4.5,
    "data": [
      {
        "month": "2024-01",
        "newSubscriptions": 90,
        "cancellations": 5,
        "revenue": 45000
      },
      {
        "month": "2024-02",
        "newSubscriptions": 96,
        "cancellations": 3,
        "revenue": 48000
      }
    ],
    "paymentMethods": {
      "razorpay": 890,
      "other": 0
    }
  }
}
```

## Content Management APIs

### 1. Category Management

**GET** `/api/admin/categories`

Get all categories with subcategories.

**Response:**
```json
{
  "categories": [
    {
      "id": "category_id",
      "name": "Engineering",
      "type": "category",
      "subcategories": [
        {
          "id": "subcategory_id",
          "name": "Computer Science",
          "type": "subcategory"
        }
      ],
      "userCount": 450
    }
  ]
}
```

**POST** `/api/admin/categories`

Create new category.

**Request Body:**
```json
{
  "name": "New Category",
  "type": "category",
  "parentId": null
}
```

**PUT** `/api/admin/categories/:categoryId`

Update category.

**DELETE** `/api/admin/categories/:categoryId`

Delete category.

### 2. Blog Management

**GET** `/api/admin/blogs`

Get all blogs with pagination.

**POST** `/api/admin/blogs`

Create new blog.

**PUT** `/api/admin/blogs/:blogId`

Update blog.

**DELETE** `/api/admin/blogs/:blogId`

Delete blog.

### 3. Quiz Management

**GET** `/api/admin/quizzes`

Get all quizzes.

**POST** `/api/admin/quizzes`

Create new quiz.

**PUT** `/api/admin/quizzes/:quizId`

Update quiz.

**DELETE** `/api/admin/quizzes/:quizId`

Delete quiz.

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `400`: Bad Request (invalid data, missing fields)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (admin access required)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error

## Usage Examples

### Get Dashboard Overview:
```javascript
const response = await fetch('/api/admin/dashboard/overview', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
});
```

### Get Users with Filtering:
```javascript
const response = await fetch('/api/admin/users?page=1&limit=20&subscription=active', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
});
```

### Update User:
```javascript
const response = await fetch('/api/admin/users/123', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + adminToken
  },
  body: JSON.stringify({
    name: 'Updated Name',
    phone: '9876543210'
  })
});
```

## Admin Dashboard Features

### 1. User Management
- View all registered users
- Filter by subscription status
- Search by name or email
- Update user information
- Delete user accounts
- View user subscription history

### 2. Analytics Dashboard
- Total user count
- Active subscriptions
- Revenue tracking
- User growth metrics
- Subscription conversion rates
- Category-wise user distribution

### 3. Revenue Tracking
- Total revenue
- Monthly recurring revenue
- Payment history
- Revenue growth trends
- Average order value
- Payment method distribution

### 4. Content Management
- Category management
- Blog management
- Quiz management
- Hero banner management
- Latest updates management
- Sponsor management

### 5. Real-time Statistics
- Live user count
- Recent registrations
- Recent payments
- Subscription status
- Revenue metrics
- User engagement

## Security Considerations

1. **Admin Authentication**: All admin endpoints require valid admin JWT tokens
2. **Role-based Access**: Only admin users can access these endpoints
3. **Data Validation**: All input data is validated and sanitized
4. **Rate Limiting**: Consider implementing rate limiting for production
5. **Audit Logging**: All admin actions should be logged for security

## Environment Variables

Required environment variables for admin functionality:
```
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
MONGODB_URI=your_mongodb_connection_string
```

This comprehensive admin API system provides full control over user management, analytics, and content while maintaining security and scalability. 