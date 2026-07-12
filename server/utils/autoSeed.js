const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const Category = require('../models/Category');

const autoSeed = async () => {
  try {
    console.log('[AutoSeed] Checking if database needs seeding...');

    // 1. Seed Categories if empty
    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      console.log('[AutoSeed] Seeding default categories...');
      const defaultCategories = [
        { name: 'Laptop', description: 'Portable computer systems' },
        { name: 'Monitor', description: 'Display monitors and screens' },
        { name: 'Printer', description: 'Document scanners and printers' },
        { name: 'Desktop', description: 'Workstation computer systems' },
        { name: 'Furniture', description: 'Desks, chairs, and office layouts' },
        { name: 'Network Device', description: 'Routers, switches, and modems' }
      ];
      await Category.insertMany(defaultCategories);
      console.log('[AutoSeed] Default categories seeded successfully.');
    }

    // 2. Seed Departments if empty
    const departmentCount = await Department.countDocuments();
    if (departmentCount === 0) {
      console.log('[AutoSeed] Seeding default departments...');
      const defaultDepts = [
        { name: 'IT', description: 'Information Technology and Systems Management' },
        { name: 'HR', description: 'Human Resources and Talent Acquisition' },
        { name: 'Finance', description: 'Financial Accounting and Audits' }
      ];
      await Department.insertMany(defaultDepts);
      console.log('[AutoSeed] Default departments seeded successfully.');
    }

    // 3. Seed Default Admin if none exists
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      console.log('[AutoSeed] Seeding default administrator account...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Admin@123', salt);
      
      const admin = new User({
        name: 'System Administrator',
        email: 'admin@assetflow.com',
        passwordHash,
        role: 'Admin'
      });
      await admin.save();
      console.log('[AutoSeed] Default admin created: admin@assetflow.com / Admin@123');
    }

    console.log('[AutoSeed] Seeding checks complete.');
  } catch (error) {
    console.error('[AutoSeed] Error seeding database:', error);
  }
};

module.exports = autoSeed;
