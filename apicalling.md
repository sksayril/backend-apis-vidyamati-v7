# API Documentation for Notes Market Platform

This document provides comprehensive documentation for all endpoints available in the Notes Market platform, including user authentication, subscription management, content access, and admin features.

## Base URL

All API requests should be made to: `http://localhost:3300` for local development.

## Authentication

Most endpoints require authentication using JWT tokens.

Include the token in the request header:
```
Authorization: Bearer {your_jwt_token}
```

## User APIs

### Registration and Authentication

#### 1. Register User
```
POST /api/users/register
```

**Request Body:**
```json
{
  "name": "User Name",
  "email": "user@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

**Response:**
```json
{
  "message": "User registered successfully"
}
```

#### 2. User Login
```
POST /api/users/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "your_jwt_token",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "subscription": {
      "isActive": false,
      "plan": "none",
      "endDate": null
    }
  }
}
```

#### 3. Get User Profile
```
GET /api/users/profile
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "9876543210",
    "subscription": {
      "isActive": true,
      "plan": "monthly",
      "endDate": "2023-06-15T00:00:00.000Z"
    }
  }
}
```

### Subscription Management

#### 1. Create Subscription Order
```
POST /api/users/subscription/create-order
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "orderId": "order_id_from_razorpay",
  "amount": 49900,
  "currency": "INR",
  "receipt": "receipt_id",
  "key_id": "rzp_test_BDT2TegS4Ax6Vp",
  "user": {
    "name": "User Name",
    "email": "user@example.com",
    "phone": "9876543210"
  }
}
```

#### 2. Verify Payment
```
POST /api/users/subscription/verify-payment
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Request Body:**
```json
{
  "razorpay_payment_id": "pay_id_from_razorpay",
  "razorpay_order_id": "order_id_from_razorpay",
  "razorpay_signature": "signature_from_razorpay"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription activated successfully",
  "subscription": {
    "isActive": true,
    "plan": "monthly",
    "startDate": "2023-05-15T00:00:00.000Z",
    "endDate": "2023-06-15T00:00:00.000Z"
  }
}
```

#### 3. Check Subscription Status
```
GET /api/users/subscription/status
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "isSubscribed": true,
  "isActive": true,
  "plan": "monthly",
  "startDate": "2023-05-15T00:00:00.000Z",
  "endDate": "2023-06-15T00:00:00.000Z",
  "paymentHistory": [
    {
      "razorpayPaymentId": "pay_id_from_razorpay",
      "amount": 499,
      "status": "success",
      "date": "2023-05-15T00:00:00.000Z"
    }
  ]
}
```

#### 4. Cancel Subscription
```
POST /api/users/subscription/cancel
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

## Content APIs (Public)

These APIs are accessible without authentication or subscription.

### 1. Get Latest Updates
```
GET /api/latest-updates
```

**Response:**
```json
{
  "data": [
    {
      "_id": "update_id",
      "title": "Update Title",
      "subtitle": "Update Subtitle",
      "image": "image_url",
      "date": "2023-05-10",
      "readTime": "5 min",
      "isTop": true,
      "content": "Update content here..."
    }
  ]
}
```

### 2. Get Hero Banners
```
GET /api/get/hero-banners
```

**Response:**
```json
{
  "data": [
    {
      "_id": "banner_id",
      "title": "Banner Title",
      "desktop": "desktop_image_url",
      "mobile": "mobile_image_url",
      "url": "redirect_url"
    }
  ]
}
```

### 3. Get Category Structure (Without Content)
```
GET /api/categories/parents
```

**Response:**
```json
[
  {
    "parents": [
      {
        "_id": "category_id",
        "name": "Category Name",
        "path": ["Category Name"]
      }
    ]
  }
]
```

### 4. Get Subcategories (Without Content)
```
GET /api/categories/subcategories/:parentId
```

**Response:**
```json
[
  {
    "subcategories": [
      {
        "_id": "subcategory_id",
        "name": "Subcategory Name",
        "parentId": "parent_id",
        "path": ["Parent Category", "Subcategory Name"]
      }
    ]
  }
]
```

### 5. Get Category Tree
```
GET /api/categories/tree
```

**Response:**
```json
[
  {
    "_id": "category_id",
    "name": "Category Name",
    "path": ["Category Name"],
    "children": [
      {
        "_id": "subcategory_id",
        "name": "Subcategory Name",
        "path": ["Category Name", "Subcategory Name"],
        "children": []
      }
    ]
  }
]
```

### 6. Get Sponsors
```
GET /api/getsponser
```

**Response:**
```json
[
  {
    "_id": "sponsor_id",
    "name": "Sponsor Name",
    "contextColor": "#FFFFFF",
    "url": "sponsor_url"
  }
]
```

## Content APIs (Subscription Required)

These APIs require authentication and an active subscription.

### 1. Get Category Details with Content
```
GET /api/categories/:id
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "_id": "category_id",
  "name": "Category Name",
  "path": ["Category Path"],
  "type": "content",
  "content": {
    "text": "Text content here...",
    "pdfUrl": "pdf_file_url",
    "imageUrls": ["image_url_1", "image_url_2"]
  }
}
```

### 2. Get Quiz Details
```
GET /api/getquizbyid/:id
```

**Headers:**
```
Authorization: Bearer your_jwt_token
```

**Response:**
```json
{
  "_id": "quiz_id",
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 2
    }
  ]
}
```

## Admin APIs

All admin APIs require authentication with admin privileges.

### Category Management

#### 1. Create Category
```
POST /api/categories
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "name": "New Category",
  "parentId": "parent_id",
  "type": "category"
}
```

#### 2. Add Content to Category
```
POST /api/categories/content
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Form Data:**
- `text`: Text content
- `categoryid`: Category ID
- `pdf`: PDF file (upload)
- `images`: Image files (multiple uploads)

#### 3. Delete Category
```
DELETE /api/categories/:id
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

### Latest Updates Management

#### 1. Upload Update
```
POST /api/latest/upload-update
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Form Data:**
- `title`: Update title
- `subtitle`: Update subtitle
- `date`: Update date
- `readTime`: Read time
- `content`: Update content
- `isTop`: Featured status (boolean)
- `image`: Image file (upload)

#### 2. Update Content
```
POST /api/latest/update-content
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "update_id",
  "content": "Updated content here..."
}
```

#### 3. Update isTop Status
```
POST /api/latest/update-isTop
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "update_id",
  "isTop": true
}
```

#### 4. Delete Update
```
POST /api/latest/delete-update
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "update_id"
}
```

### Hero Banner Management

#### 1. Upload Hero Banner
```
POST /api/upload-hero-banner
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Form Data:**
- `title`: Banner title
- `url`: Redirect URL
- `desktop`: Desktop image file (upload)
- `mobile`: Mobile image file (upload)

#### 2. Delete Hero Banner
```
POST /api/delete-hero-banner
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "banner_id"
}
```

### Quiz Management

#### 1. Create Quiz
```
POST /api/create/quiz
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 2
    }
  ]
}
```

#### 2. Delete Quiz
```
POST /api/delete/quiz
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "quiz_id"
}
```

### Sponsor Management

#### 1. Add Sponsor
```
POST /api/addsponser
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "name": "Sponsor Name",
  "contextColor": "#FFFFFF",
  "url": "sponsor_url"
}
```

#### 2. Update Sponsor
```
POST /api/update/sponser
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "id": "sponsor_id",
  "name": "Updated Sponsor Name",
  "contextColor": "#000000",
  "url": "updated_sponsor_url"
}
```

#### 3. Delete Sponsor
```
POST /api/delete/sponser
```

**Headers:**
```
Authorization: Bearer admin_jwt_token
```

**Request Body:**
```json
{
  "_id": "sponsor_id"
}
```

## Razorpay Integration

### Frontend Integration (JavaScript)

Include the Razorpay checkout script in your frontend:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Implementation Example

```javascript
// When user clicks on subscribe button
async function initiateSubscription() {
  try {
    // Step 1: Get order details from your backend
    const response = await fetch('/api/users/subscription/create-order', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      }
    });
    
    const orderData = await response.json();
    
    // Step 2: Configure Razorpay
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "Notes Market",
      description: "Monthly Subscription (₹499)",
      order_id: orderData.orderId,
      prefill: {
        name: orderData.user.name,
        email: orderData.user.email,
        contact: orderData.user.phone
      },
      theme: {
        color: "#3399cc"
      },
      handler: async function(response) {
        // Step 3: Verify payment on your backend
        await verifyPayment(
          response.razorpay_payment_id,
          response.razorpay_order_id,
          response.razorpay_signature
        );
      }
    };
    
    // Step 4: Open Razorpay checkout
    const razorpayInstance = new Razorpay(options);
    razorpayInstance.open();
    
  } catch (error) {
    console.error("Payment initiation failed:", error);
    alert("Payment initiation failed. Please try again.");
  }
}

// Function to verify payment
async function verifyPayment(paymentId, orderId, signature) {
  try {
    const response = await fetch('/api/users/subscription/verify-payment', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + userToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        razorpay_payment_id: paymentId,
        razorpay_order_id: orderId,
        razorpay_signature: signature
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Payment successful, update UI accordingly
      alert("Subscription activated successfully!");
      // Refresh user data or redirect to subscription page
    } else {
      alert("Payment verification failed. Please contact support.");
    }
  } catch (error) {
    console.error("Payment verification failed:", error);
    alert("Payment verification failed. Please contact support.");
  }
}
```

## Error Handling

All APIs follow a consistent error response format:

```json
{
  "message": "Error message description",
  "error": "Detailed error information"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden (No subscription)
- 404: Not Found
- 500: Server Error
