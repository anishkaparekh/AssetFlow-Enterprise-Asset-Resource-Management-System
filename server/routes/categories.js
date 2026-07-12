const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error retrieving categories' });
  }
});

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (Admin only)
router.post('/', authMiddleware, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({
      name,
      description: description || ''
    });

    const savedCategory = await newCategory.save();
    res.status(201).json({
      message: 'Category created successfully',
      category: savedCategory
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ message: 'Server error creating category' });
  }
});

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Private (Admin only)
router.put('/:id', authMiddleware, authorizeRoles('Admin'), async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (name) {
      const existingCategory = await Category.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      if (existingCategory) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      category.name = name;
    }

    if (description !== undefined) {
      category.description = description;
    }

    const updatedCategory = await category.save();
    res.json({
      message: 'Category updated successfully',
      category: updatedCategory
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ message: 'Server error updating category' });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, authorizeRoles('Admin'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error deleting category' });
  }
});

module.exports = router;
