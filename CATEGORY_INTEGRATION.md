# Hierarchical Category Integration for User Registration and Login

## Overview
The user registration and login system has been updated to support hierarchical categories. Users must now select both a parent category and a subcategory during registration, and this information is returned during login.

## Changes Made

### 1. User Model Updates (`models/user.model.js`)
- Replaced `categoryId` with `parentCategoryId` and `subCategoryId` fields
- Both fields are required and reference the Category model
- Type: `mongoose.Schema.Types.ObjectId`
- Reference: `'Category'`

### 2. Registration API Updates (`routes/user.routes.js`)
- **Endpoint**: `POST /register`
- **New Required Fields**: `parentCategoryId` and `subCategoryId`
- **Validation**: 
  - Checks if both parent and sub categories exist
  - Validates that subcategory belongs to the selected parent category
- **Error Handling**: Returns appropriate error messages for missing or invalid categories

### 3. Login API Updates (`routes/user.routes.js`)
- **Endpoint**: `POST /login`
- **New Response**: Includes both parent and subcategory information
- **Category Data**: Returns parent and subcategory ID, name, and type

### 4. Profile API Updates (`routes/user.routes.js`)
- **Endpoint**: `GET /profile`
- **New Response**: Includes both parent and subcategory information in user profile
- **Category Data**: Returns parent and subcategory ID, name, and type

### 5. Enhanced Categories API (`routes/user.routes.js`)
- **Endpoint**: `GET /categories`
- **Purpose**: Get hierarchical category structure for registration
- **Response**: Parent categories with their subcategories nested

### 6. New Subcategories API (`routes/user.routes.js`)
- **Endpoint**: `GET /categories/:parentId/subcategories`
- **Purpose**: Get subcategories for a specific parent category
- **Response**: Parent category info and list of subcategories

## API Usage Examples

### Registration
```javascript
POST /register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890",
  "parentCategoryId": "507f1f77bcf86cd799439011",
  "subCategoryId": "507f1f77bcf86cd799439012"
}
```

### Login Response
```javascript
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "parentCategory": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Technology",
      "type": "category"
    },
    "subCategory": {
      "id": "507f1f77bcf86cd799439012",
      "name": "Web Development",
      "type": "category"
    },
    "subscription": {
      "isActive": false,
      "plan": "none",
      "endDate": null
    }
  }
}
```

### Get Categories (Hierarchical)
```javascript
GET /categories
```

Response:
```javascript
{
  "categories": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Technology",
      "type": "category",
      "subCategories": [
        {
          "id": "507f1f77bcf86cd799439012",
          "name": "Web Development",
          "type": "category"
        },
        {
          "id": "507f1f77bcf86cd799439013",
          "name": "Mobile Development",
          "type": "category"
        }
      ]
    },
    {
      "id": "507f1f77bcf86cd799439014",
      "name": "Business",
      "type": "category",
      "subCategories": [
        {
          "id": "507f1f77bcf86cd799439015",
          "name": "Marketing",
          "type": "category"
        },
        {
          "id": "507f1f77bcf86cd799439016",
          "name": "Finance",
          "type": "category"
        }
      ]
    }
  ]
}
```

### Get Subcategories for Parent
```javascript
GET /categories/507f1f77bcf86cd799439011/subcategories
```

Response:
```javascript
{
  "parentCategory": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Technology",
    "type": "category"
  },
  "subCategories": [
    {
      "id": "507f1f77bcf86cd799439012",
      "name": "Web Development",
      "type": "category"
    },
    {
      "id": "507f1f77bcf86cd799439013",
      "name": "Mobile Development",
      "type": "category"
    }
  ]
}
```

## Migration for Existing Users

If you have existing users without proper category assignments, run the migration script:

```bash
node migrate-users-category.js
```

This script will:
1. Find or create default parent and subcategories
2. Assign default categories to users without proper assignments
3. Migrate users with old `categoryId` field to new structure
4. Handle legacy data appropriately

## Frontend Integration

1. **Registration Form**: 
   - Add parent category dropdown populated from `/categories` endpoint
   - Add subcategory dropdown that updates based on selected parent
   - Use `/categories/:parentId/subcategories` for dynamic subcategory loading

2. **Login Response**: Update to handle both parent and subcategory information

3. **Profile Display**: Show both parent and subcategory information in profile sections

## Error Handling

- **Missing Parent Category**: Returns 400 error with "Parent category ID is required"
- **Missing Sub Category**: Returns 400 error with "Sub category ID is required"
- **Invalid Parent Category**: Returns 400 error with "Invalid parent category ID"
- **Invalid Sub Category**: Returns 400 error with "Invalid sub category ID"
- **Mismatched Categories**: Returns 400 error with "Sub category does not belong to the selected parent category"
- **Database Errors**: Returns 500 error with server error message

## Category Structure Requirements

- Parent categories should have `parentId: null` or no `parentId` field
- Subcategories should have `parentId` pointing to a valid parent category
- Both parent and subcategories should have `type: 'category'` 