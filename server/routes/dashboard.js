const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Booking = require('../models/Booking');
const Transfer = require('../models/Transfer');
const Audit = require('../models/Audit');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard KPIs and list details based on role
// @access  Private
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    // Fetch active user profile to get departmentId
    const activeUser = await User.findById(userId);
    const userDeptId = activeUser ? activeUser.departmentId : null;

    let responseData = { role };

    if (role === 'Admin') {
      // 1. Admin Dashboard Stats
      const [totalUsers, totalDepts, totalAssets, activeAudits] = await Promise.all([
        User.countDocuments(),
        Department.countDocuments(),
        Asset.countDocuments(),
        Audit.countDocuments({ status: 'Pending' }),
      ]);

      responseData.stats = {
        totalUsers,
        totalDepartments: totalDepts,
        totalAssets,
        activeAudits,
      };

      // Extra activity log info
      responseData.recentDepartments = await Department.find().limit(5).populate('headId', 'name');
      responseData.recentUsers = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).limit(5);
    } 
    
    else if (role === 'Asset Manager') {
      // 2. Asset Manager Dashboard Stats
      const [available, allocated, maintenanceToday, pendingTransfers, upcomingReturns] = await Promise.all([
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Allocated' }),
        Maintenance.countDocuments({ status: { $in: ['Approved', 'In Progress'] } }),
        Transfer.countDocuments({ status: 'Pending' }),
        Booking.countDocuments({ status: 'Confirmed', endDate: { $gte: new Date() } }),
      ]);

      responseData.stats = {
        availableAssets: available,
        allocatedAssets: allocated,
        maintenanceToday,
        pendingTransfers,
        upcomingReturns,
      };

      // Fetch assets list under maintenance
      responseData.activeMaintenanceList = await Maintenance.find({ status: { $in: ['Approved', 'In Progress'] } })
        .populate('assetId', 'assetTag name')
        .populate('requesterId', 'name')
        .limit(5);
    } 
    
    else if (role === 'Department Head') {
      // 3. Department Head Dashboard Stats
      // Find assets matching this head's departmentId
      const deptFilter = userDeptId || 'N/A';
      
      // Find department users
      const deptUsers = await User.find({ departmentId: deptFilter }, '_id');
      const deptUserIds = deptUsers.map(u => u._id);

      const [deptAssetsCount, pendingApprovals, teamBookingsCount] = await Promise.all([
        Asset.countDocuments({ departmentId: deptFilter }),
        // Approvals could be transfers to/from department or bookings waiting approval
        Transfer.countDocuments({ 
          toDepartmentId: deptFilter, 
          status: 'Pending' 
        }),
        Booking.countDocuments({ 
          userId: { $in: deptUserIds }, 
          status: 'Pending' 
        }),
      ]);

      responseData.stats = {
        departmentAssets: deptAssetsCount,
        pendingApprovals: pendingApprovals + teamBookingsCount,
        teamBookings: teamBookingsCount,
      };

      responseData.departmentInfo = userDeptId ? await Department.findOne({ _id: userDeptId }) : null;
      
      // List of department assets
      responseData.deptAssetsList = await Asset.find({ departmentId: deptFilter })
        .populate('currentHolderId', 'name email')
        .limit(5);
    } 
    
    else {
      // 4. Employee Dashboard Stats (Default)
      const [myAssets, myBookings, myMaintenance] = await Promise.all([
        Asset.find({ currentHolderId: userId }),
        Booking.find({ userId }).populate('assetId', 'name assetTag category'),
        Maintenance.find({ requesterId: userId }).populate('assetId', 'name assetTag status').sort({ createdAt: -1 }),
      ]);

      responseData.stats = {
        myAssetsCount: myAssets.length,
        myBookingsCount: myBookings.length,
        myMaintenanceCount: myMaintenance.length,
      };

      responseData.myAssets = myAssets;
      responseData.myBookings = myBookings;
      responseData.myMaintenanceList = myMaintenance;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Dashboard aggregation stats error:', error);
    res.status(500).json({ message: 'Server error compiling dashboard analytics' });
  }
});

module.exports = router;
