const mongoose = require('mongoose');
const User = require('./models/user.model');
const Category = require('./models/category.model');
require('dotenv').config();

async function migrateUsersCategory() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database');
    console.log('Connected to MongoDB');

    // Get or create a default parent category
    let defaultParentCategory = await Category.findOne({ 
      $or: [
        { parentId: null },
        { parentId: { $exists: false } }
      ],
      type: 'category'
    });
    
    if (!defaultParentCategory) {
      console.log('No parent categories found. Creating a default parent category...');
      defaultParentCategory = new Category({
        name: 'Default Parent Category',
        type: 'category'
      });
      await defaultParentCategory.save();
      console.log('Default parent category created with ID:', defaultParentCategory._id);
    }

    // Get or create a default subcategory under the parent
    let defaultSubCategory = await Category.findOne({ 
      parentId: defaultParentCategory._id,
      type: 'category'
    });
    
    if (!defaultSubCategory) {
      console.log('No subcategories found. Creating a default subcategory...');
      defaultSubCategory = new Category({
        name: 'Default Sub Category',
        type: 'category',
        parentId: defaultParentCategory._id
      });
      await defaultSubCategory.save();
      console.log('Default subcategory created with ID:', defaultSubCategory._id);
    }

    // Find users without parentCategoryId or subCategoryId
    const usersWithoutCategories = await User.find({
      $or: [
        { parentCategoryId: { $exists: false } },
        { subCategoryId: { $exists: false } },
        { parentCategoryId: null },
        { subCategoryId: null }
      ]
    });
    
    console.log(`Found ${usersWithoutCategories.length} users without proper category assignments`);

    if (usersWithoutCategories.length > 0) {
      // Update all users without categories to use the default categories
      const result = await User.updateMany(
        {
          $or: [
            { parentCategoryId: { $exists: false } },
            { subCategoryId: { $exists: false } },
            { parentCategoryId: null },
            { subCategoryId: null }
          ]
        },
        { 
          parentCategoryId: defaultParentCategory._id,
          subCategoryId: defaultSubCategory._id
        }
      );
      
      console.log(`Updated ${result.modifiedCount} users with default categories`);
    } else {
      console.log('All users already have proper category assignments');
    }

    // Handle legacy users with old categoryId field
    const usersWithOldCategoryId = await User.find({ categoryId: { $exists: true } });
    console.log(`Found ${usersWithOldCategoryId.length} users with old categoryId field`);

    if (usersWithOldCategoryId.length > 0) {
      for (const user of usersWithOldCategoryId) {
        // Check if the old categoryId is a parent or subcategory
        const oldCategory = await Category.findById(user.categoryId);
        if (oldCategory) {
          if (oldCategory.parentId) {
            // It's a subcategory, set both parent and sub
            user.parentCategoryId = oldCategory.parentId;
            user.subCategoryId = user.categoryId;
          } else {
            // It's a parent category, set as parent and use default sub
            user.parentCategoryId = user.categoryId;
            user.subCategoryId = defaultSubCategory._id;
          }
          // Remove the old field
          user.categoryId = undefined;
          await user.save();
        } else {
          // Invalid category, use defaults
          user.parentCategoryId = defaultParentCategory._id;
          user.subCategoryId = defaultSubCategory._id;
          user.categoryId = undefined;
          await user.save();
        }
      }
      console.log(`Migrated ${usersWithOldCategoryId.length} users from old categoryId structure`);
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateUsersCategory();
}

module.exports = migrateUsersCategory; 