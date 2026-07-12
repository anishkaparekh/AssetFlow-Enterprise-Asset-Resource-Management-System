const express = require('express');
const router = express.Router();
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

// Middleware to verify Admin authorization
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied, administrator role required' });
  }
};

// @route   GET /api/users
// @desc    Get all users (directory)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Return all users. We can fetch and populate department information if available.
    // Note: departmentId is stored as a string or null in our schema, but let's make sure it queries properly.
    // Wait, in User schema departmentId is a String. To populate it, we would need it to be a ref.
    // But since we can fetch it, let's keep it as String, or if we can populate it, we can query it.
    // If it's a string, we can just return it, and on the frontend we can map it to our departments list.
    // Mapping it on the frontend is extremely robust and avoids changing User schema's departmentId type!
    const users = await User.find({}, '-passwordHash').sort({ name: 1 });
    res.json(users);
  } catch (error) {
    console.error('Error fetching user directory:', error);
    res.status(500).json({ message: 'Server error retrieving user directory' });
  }
});

// @route   PUT /api/users/:id/role
// @desc    Update a user's role and department (Admin only)
// @access  Private/Admin
router.put('/:id/role', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { role, departmentId } = req.body;
    const userId = req.params.id;

    const validRoles = ['Admin', 'Asset Manager', 'Department Head', 'Employee'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role assignment' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (role) user.role = role;
    if (departmentId !== undefined) {
      user.departmentId = departmentId || null;
    }

    const updatedUser = await user.save();
    res.json({
      message: 'User profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Server error updating user profile' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update employee profile details (Admin only)
// @access  Private/Admin
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, role, departmentId, status } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ message: 'Email address already in use' });
      }
      user.email = email.toLowerCase();
    }

    if (name) user.name = name.trim();

    const validRoles = ['Admin', 'Asset Manager', 'Department Head', 'Employee'];
    if (role) {
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role assignment' });
      }
      user.role = role;
    }

    if (departmentId !== undefined) {
      user.departmentId = departmentId || null;
    }

    const validStatuses = ['Active', 'Inactive'];
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }
      user.status = status;
    }

    const updatedUser = await user.save();
    res.json({
      message: 'Employee profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error updating user profile' });
  }
});

module.exports = router;
