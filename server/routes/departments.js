const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Department = require('../models/Department');

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
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Access denied, administrator role required' });
  }
};

// @route   GET /api/departments
// @desc    Get all departments (Populates head profile)
// @access  Private/Admin
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('headId', 'name email role')
      .sort({ name: 1 });
      
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error retrieving departments list' });
  }
});

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private/Admin
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, headId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    // Check if department name already exists
    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'A department with this name already exists' });
    }

    const newDept = new Department({
      name,
      description,
      headId: headId || null,
    });

    const savedDept = await newDept.save();
    
    // Populate head info before returning
    const populatedDept = await Department.findById(savedDept._id).populate('headId', 'name email role');

    res.status(201).json({
      message: 'Department created successfully',
      department: populatedDept,
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error creating department' });
  }
});

// @route   PUT /api/departments/:id
// @desc    Update an existing department
// @access  Private/Admin
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description, headId } = req.body;
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    if (name) {
      const existingDept = await Department.findOne({ name, _id: { $ne: req.params.id } });
      if (existingDept) {
        return res.status(400).json({ message: 'Department name already in use' });
      }
      dept.name = name;
    }

    if (description !== undefined) {
      dept.description = description;
    }

    if (headId !== undefined) {
      dept.headId = headId || null;
    }

    const savedDept = await dept.save();
    const populatedDept = await Department.findById(savedDept._id).populate('headId', 'name email role');

    res.json({
      message: 'Department updated successfully',
      department: populatedDept,
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error updating department' });
  }
});

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private/Admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ message: 'Server error deleting department' });
  }
});

module.exports = router;
