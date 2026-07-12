const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const Asset = require('../models/Asset');
const Maintenance = require('../models/Maintenance');
const Booking = require('../models/Booking');
const Allocation = require('../models/Allocation');
const Audit = require('../models/Audit');
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
      const [
        totalUsers,
        totalDepts,
        totalAssets,
        availableAssets,
        allocatedAssets,
        underMaintenance,
        pendingTransfers,
        pendingMaintenance
      ] = await Promise.all([
        User.countDocuments(),
        Department.countDocuments(),
        Asset.countDocuments(),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Allocated' }),
        Asset.countDocuments({ status: 'Under Maintenance' }),
        Allocation.countDocuments({ allocationStatus: 'Transfer Requested' }),
        Maintenance.countDocuments({ status: 'Pending' })
      ]);

      responseData.stats = {
        totalUsers,
        totalDepartments: totalDepts,
        totalAssets,
        availableAssets,
        allocatedAssets,
        underMaintenance,
        pendingRequests: pendingTransfers + pendingMaintenance
      };

      // Extra activity log info
      responseData.recentDepartments = await Department.find().limit(5).populate('headId', 'name');
      responseData.recentUsers = await User.find({}, '-passwordHash').sort({ createdAt: -1 }).limit(5);
    } 
    
    else if (role === 'asset_manager') {
      // 2. Asset Manager Dashboard Stats
      const [pendingMaint, underMaint, completedMaint, available, allocated, pendingTransfers, upcomingReturns] = await Promise.all([
        MaintenanceRequest.countDocuments({ status: 'Pending' }),
        Asset.countDocuments({ status: 'Under Maintenance' }),
        MaintenanceRequest.countDocuments({ status: 'Completed' }),
        Asset.countDocuments({ status: 'Available' }),
        Asset.countDocuments({ status: 'Allocated' }),
        Allocation.countDocuments({ allocationStatus: 'Transfer Requested' }),
        Allocation.countDocuments({ allocationStatus: 'Allocated', expectedReturnDate: { $gte: new Date() } }),
      ]);

      responseData.stats = {
        pendingMaintenance: pendingMaint,
        assetsUnderMaintenance: underMaint,
        completedToday: completedMaint,
        availableAssets: available,
        allocatedAssets: allocated,
        pendingTransfers,
        upcomingReturns,
      };

      // Fetch assets list under maintenance
      responseData.activeMaintenanceList = await MaintenanceRequest.find({ status: { $in: ['Approved', 'In Progress'] } })
        .populate('assetId', 'assetTag name')
        .populate('employeeId', 'name')
        .limit(5);
    } 
    
    else if (role === 'department_head') {
      // 3. Department Head Dashboard Stats
      const deptFilter = userDeptId || null;
      
      let deptUserIds = [];
      if (deptFilter) {
        const deptUsers = await User.find({ departmentId: deptFilter }, '_id');
        deptUserIds = deptUsers.map(u => u._id);
      }

      const [deptAssetsCount, deptAllocationsCount, pendingApprovalsCount] = await Promise.all([
        deptFilter ? Asset.countDocuments({ departmentId: deptFilter }) : 0,
        deptUserIds.length ? Allocation.countDocuments({ employeeId: { $in: deptUserIds }, allocationStatus: 'Allocated' }) : 0,
        deptUserIds.length ? Allocation.countDocuments({ 
          allocationStatus: 'Transfer Requested',
          $or: [
            { employeeId: { $in: deptUserIds } },
            { targetHolderId: { $in: deptUserIds } }
          ]
        }) : 0
      ]);

      responseData.stats = {
        departmentAssets: deptAssetsCount,
        departmentAllocations: deptAllocationsCount,
        pendingApprovals: pendingApprovalsCount,
      };

      responseData.departmentInfo = deptFilter ? await Department.findOne({ _id: deptFilter }) : null;
      
      // List of department assets
      responseData.deptAssetsList = deptFilter ? await Asset.find({ departmentId: deptFilter })
        .populate('currentHolderId', 'name email')
        .limit(5) : [];
    } 
    
    else {
      // 4. Employee Dashboard Stats (Default)
      const [myAllocations, myBookings, myMaintenance] = await Promise.all([
        Allocation.find({ employeeId: userId, allocationStatus: 'Allocated' }).populate('assetId'),
        Booking.find({ employeeId: userId }).populate('assetId', 'name assetTag category'),
        MaintenanceRequest.find({ employeeId: userId }).populate('assetId', 'name assetTag status').sort({ createdAt: -1 }),
      ]);

      const pendingMaintenance = myMaintenance.filter(r => r.status === 'Pending').length;
      const completedMaintenance = myMaintenance.filter(r => r.status === 'Completed').length;

      // Calculate overdue return requests (Rudra's metric)
      const overdueReturnsCount = await Allocation.countDocuments({
        employeeId: userId,
        allocationStatus: 'Allocated',
        expectedReturnDate: { $lt: new Date() }
      });

      responseData.stats = {
        myAssetsCount: myAllocations.length,
        pendingMaintenance,
        completedMaintenance,
        currentAllocations: myAllocations.length,
        myBookingsCount: myBookings.length,
        myMaintenanceCount: myMaintenance.length,
        returnRequests: overdueReturnsCount,
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
