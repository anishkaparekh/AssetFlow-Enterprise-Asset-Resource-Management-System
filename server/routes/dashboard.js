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
const Allocation = require('../models/Allocation');
const MaintenanceRequest = require('../models/MaintenanceRequest');
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

    if (role === 'admin') {
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
    
    else if (role === 'asset_manager') {
      // 2. Asset Manager Dashboard Stats
      const [pendingMaint, underMaint, completedMaint, available, allocated] = await Promise.all([
        MaintenanceRequest.countDocuments({ status: 'Pending' }),
        Asset.countDocuments({ status: 'Under Maintenance' }),
        MaintenanceRequest.countDocuments({ status: 'Completed' }),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Allocated' }),
      ]);

      responseData.stats = {
        pendingMaintenance: pendingMaint,
        assetsUnderMaintenance: underMaint,
        completedToday: completedMaint,
        availableAssets: available,
        allocatedAssets: allocated,
      };

      // Fetch assets list under maintenance
      responseData.activeMaintenanceList = await MaintenanceRequest.find({ status: { $in: ['Approved', 'In Progress'] } })
        .populate('assetId', 'assetTag name')
        .populate('employeeId', 'name')
        .limit(5);
    } 
    
    else if (role === 'department_head') {
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
          employeeId: { $in: deptUserIds }, 
          status: 'Upcoming' 
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
      console.log('Dashboard query - userId:', userId.toString());
      const allAllocs = await Allocation.find({});
      console.log('Total allocations in DB:', allAllocs.length);
      if (allAllocs.length > 0) {
        console.log('First allocation details:', {
          employeeId: allAllocs[0].employeeId.toString(),
          status: allAllocs[0].status,
          assetId: allAllocs[0].assetId
        });
      }

      const [myAllocations, myBookings, myMaintenance] = await Promise.all([
        Allocation.find({ employeeId: userId, status: 'Active' }).populate('assetId'),
        Booking.find({ employeeId: userId }).populate('assetId', 'name assetTag category'),
        MaintenanceRequest.find({ employeeId: userId }).populate('assetId', 'name assetTag status').sort({ createdAt: -1 }),
      ]);

      console.log('Matching allocations count:', myAllocations.length);

      const pendingMaintenance = myMaintenance.filter(r => r.status === 'Pending').length;
      const completedMaintenance = myMaintenance.filter(r => r.status === 'Completed').length;

      responseData.stats = {
        myAssetsCount: myAllocations.length,
        pendingMaintenance,
        completedMaintenance,
        currentAllocations: myAllocations.length,
      };

      responseData.myAllocations = myAllocations;
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
