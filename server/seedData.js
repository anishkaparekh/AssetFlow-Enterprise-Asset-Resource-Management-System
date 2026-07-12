require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Department = require('./models/Department');
const Asset = require('./models/Asset');
const Maintenance = require('./models/Maintenance');
const Booking = require('./models/Booking');
const Transfer = require('./models/Transfer');
const Audit = require('./models/Audit');
const Notification = require('./models/Notification');

const seedDatabase = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetflow';
    console.log(`Connecting to MongoDB to seed data: ${connStr}...`);
    await mongoose.connect(connStr);
    console.log('Connected.');

    // 1. Clear existing database
    console.log('Clearing existing data collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      Asset.deleteMany({}),
      Maintenance.deleteMany({}),
      Booking.deleteMany({}),
      Transfer.deleteMany({}),
      Audit.deleteMany({}),
      Notification.deleteMany({}),
    ]);
    console.log('Collections cleared.');

    // 2. Hash default passwords
    console.log('Encrypting user passwords...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 3. Create Departments (First pass: without headId)
    console.log('Creating departments...');
    const deptEngineering = new Department({
      name: 'Engineering',
      description: 'Software development, QA engineering, and product operations.',
    });
    const deptDesign = new Department({
      name: 'Product Design',
      description: 'UX design, brand identity, and user research laboratory.',
    });

    const savedEngDept = await deptEngineering.save();
    const savedDesignDept = await deptDesign.save();

    // 4. Create Users (assigned to departments)
    console.log('Creating users...');
    const adminUser = new User({
      name: 'Alice Admin',
      email: 'admin@assetflow.com',
      passwordHash,
      role: 'admin',
    });

    const managerUser = new User({
      name: 'Bob Manager',
      email: 'manager@assetflow.com',
      passwordHash,
      role: 'asset_manager',
    });

    const headUser = new User({
      name: 'Charlie Head',
      email: 'head@assetflow.com',
      passwordHash,
      role: 'department_head',
      departmentId: savedEngDept._id.toString(),
    });

    const employeeUser = new User({
      name: 'David Employee',
      email: 'employee@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: savedEngDept._id.toString(),
    });

    const savedAdmin = await adminUser.save();
    const savedManager = await managerUser.save();
    const savedHead = await headUser.save();
    const savedEmployee = await employeeUser.save();

    // 5. Update Department Head reference
    savedEngDept.headId = savedHead._id;
    await savedEngDept.save();

    // 6. Create Assets
    console.log('Creating assets...');
    const assets = [
      {
        assetTag: 'AST-LTP-001',
        name: 'MacBook Pro 16" M3 Max',
        category: 'Laptops',
        status: 'Allocated',
        currentHolderId: savedEmployee._id,
        departmentId: savedEngDept._id.toString(),
      },
      {
        assetTag: 'AST-LTP-002',
        name: 'Dell XPS 15 9530',
        category: 'Laptops',
        status: 'Available',
        currentHolderId: null,
        departmentId: savedEngDept._id.toString(),
      },
      {
        assetTag: 'AST-SVR-001',
        name: 'HP ProLiant DL360 Gen10',
        category: 'Servers',
        status: 'Under Maintenance',
        currentHolderId: null,
        departmentId: savedEngDept._id.toString(),
      },
      {
        assetTag: 'AST-MON-001',
        name: 'Studio Display Nano-Texture',
        category: 'Monitors',
        status: 'Available',
        currentHolderId: null,
        departmentId: savedDesignDept._id.toString(),
      },
    ];

    const savedAssets = await Asset.insertMany(assets);

    // 7. Create Maintenance requests
    console.log('Creating maintenance requests...');
    const maintenanceTicket = new Maintenance({
      assetId: savedAssets[2]._id, // HP ProLiant Server
      requesterId: savedEmployee._id,
      description: 'RAID Controller failure on drive bay 3. Needs swap.',
      status: 'Approved',
      startDate: new Date(),
    });
    await maintenanceTicket.save();

    // 8. Create Bookings
    console.log('Creating asset reservations (bookings)...');
    const booking = new Booking({
      assetId: savedAssets[1]._id, // Dell XPS
      employeeId: savedEmployee._id,
      status: 'Upcoming',
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
    await booking.save();

    // 9. Create Transfers
    console.log('Creating pending transfers...');
    const transfer = new Transfer({
      assetId: savedAssets[3]._id, // Studio Display
      fromUserId: null,
      toUserId: savedEmployee._id,
      fromDepartmentId: savedDesignDept._id.toString(),
      toDepartmentId: savedEngDept._id.toString(),
      status: 'Pending',
      requestedById: savedHead._id,
    });
    await transfer.save();

    // 10. Create Compliance Audits
    console.log('Creating active audits...');
    const audit = new Audit({
      assetId: savedAssets[0]._id, // MacBook Pro
      status: 'Pending',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    });
    await audit.save();

    // 11. Create Notifications
    console.log('Creating notifications...');
    const notifications = [
      {
        userId: savedEmployee._id,
        title: 'Hardware Assigned',
        message: 'MacBook Pro 16" (AST-LTP-001) has been assigned to you. Inspect and verify configuration.',
        type: 'Asset Assigned',
        isRead: false,
      },
      {
        userId: savedHead._id,
        title: 'Maintenance Update',
        message: 'Maintenance for asset HP ProLiant DL360 (AST-SVR-001) has been approved by Asset Manager.',
        type: 'Maintenance Approved',
        isRead: false,
      },
    ];
    await Notification.insertMany(notifications);

    console.log('\n=========================================');
    console.log('Database Seeding Completed Successfully!');
    console.log('=========================================');
    console.log('User Accounts for testing (Password: "password123"):');
    console.log('  1. Admin:           admin@assetflow.com');
    console.log('  2. Asset Manager:    manager@assetflow.com');
    console.log('  3. Department Head:  head@assetflow.com');
    console.log('  4. Employee:         employee@assetflow.com');
    console.log('=========================================');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seeding database error:', error.message);
    process.exit(1);
  }
};

seedDatabase();
