const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecure_assetflow_secret_key_13579';

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid or expired' });
  }
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, departmentId } = req.body;

    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user. CRITICAL: Force role to 'employee' to block custom role input
    const newUser = new User({
      name,
      email,
      passwordHash,
      role: 'employee',
      departmentId: departmentId || null,
    });

    const savedUser = await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: savedUser,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check for user
    const user = await User.findOne({ email });
    
    console.log('\nLogin Attempt:');
    console.log(`Email: ${email}`);
    console.log(`User Found: ${user ? 'YES' : 'NO'}`);
    
    if (!user) {
      console.log('Reason: User not found in database');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Verify password using bcrypt.compare
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password Match: ${isMatch ? 'YES' : 'NO'}`);
    
    if (!isMatch) {
      console.log('Reason: Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`Role: ${user.role}`);

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    console.log('JWT Generated');

    // Redirect mapping
    let redirectPath = '/dashboard';
    if (user.role === 'admin') redirectPath = '/admin';
    else if (user.role === 'asset_manager') redirectPath = '/asset-manager';
    else if (user.role === 'department_head') redirectPath = '/department-head';
    else if (user.role === 'employee') redirectPath = '/employee';

    console.log(`Redirect: ${redirectPath}`);

    res.json({
      message: 'Login successful',
      token,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// @route   POST /api/auth/seed
// @desc    Seed MERN database collections over HTTP (dev helper)
// @access  Public
router.post('/seed', async (req, res) => {
  try {
    const Department = require('../models/Department');
    const Asset = require('../models/Asset');
    const Booking = require('../models/Booking');
    const Transfer = require('../models/Transfer');
    const Audit = require('../models/Audit');
    const Notification = require('../models/Notification');
    const MaintenanceRequest = require('../models/MaintenanceRequest');
    const Allocation = require('../models/Allocation');

    console.log('HTTP Seeding initiated...');
    
    // Clear collections (keep admin)
    await Promise.all([
      User.deleteMany({ email: { $ne: 'admin@assetflow.com' } }),
      Department.deleteMany({}),
      Asset.deleteMany({}),
      Booking.deleteMany({}),
      Transfer.deleteMany({}),
      Audit.deleteMany({}),
      Notification.deleteMany({}),
      MaintenanceRequest.deleteMany({}),
      Allocation.deleteMany({}),
    ]);

    // Create Departments
    const deptEngineering = new Department({
      name: 'Engineering',
      description: 'Software development, QA engineering, and product operations.',
    });
    const savedEngDept = await deptEngineering.save();

    // Create manager user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);
    const managerUser = new User({
      name: 'Bob Manager',
      email: 'manager@assetflow.com',
      passwordHash,
      role: 'asset_manager',
    });
    const savedManager = await managerUser.save();

    // Create employee user
    const employeeUser = new User({
      name: 'David Employee',
      email: 'employee@assetflow.com',
      passwordHash,
      role: 'employee',
      departmentId: savedEngDept._id.toString(),
    });
    const savedEmployee = await employeeUser.save();

    // Create Assets
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
    ];
    const savedAssets = await Asset.insertMany(assets);

    const adminUser = await User.findOne({ email: 'admin@assetflow.com' });
    const adminId = adminUser ? adminUser._id : savedManager._id;

    // Create matching Allocation document
    const allocation = new Allocation({
      assetId: savedAssets[0]._id,
      employeeId: savedEmployee._id,
      allocatedBy: adminId,
      allocationDate: new Date(),
      expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      allocationStatus: 'Allocated',
    });
    await allocation.save();

    console.log('HTTP Seeding completed successfully!');
    res.json({ message: 'Seeding completed successfully over HTTP' });
  } catch (err) {
    console.error('HTTP Seeding error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
