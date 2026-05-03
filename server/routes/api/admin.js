const express = require('express');
const validateToken = require('../../middleware/auth');
const requireAdmin = require('../../middleware/admin');
const {
  getDashboardMetrics,
  getRevenueSeries,
  getRecentTransactions,
  getActiveRooms,
  getApprovalQueue,
  approveTransaction,
  rejectTransaction,
  searchUsers,
  getUserDetails,
  adjustBalance,
  restrictUser,
} = require('../../controllers/admin');

const router = express.Router();

router.get('/metrics', validateToken, requireAdmin, getDashboardMetrics);
router.get('/revenue', validateToken, requireAdmin, getRevenueSeries);
router.get('/transactions', validateToken, requireAdmin, getRecentTransactions);
router.get('/rooms', validateToken, requireAdmin, getActiveRooms);
router.get('/approvals', validateToken, requireAdmin, getApprovalQueue);
router.post(
  '/approvals/:id/approve',
  validateToken,
  requireAdmin,
  approveTransaction,
);
router.post(
  '/approvals/:id/reject',
  validateToken,
  requireAdmin,
  rejectTransaction,
);
router.get('/users', validateToken, requireAdmin, searchUsers);
router.get('/users/:userId', validateToken, requireAdmin, getUserDetails);
router.post(
  '/users/:userId/adjust-balance',
  validateToken,
  requireAdmin,
  adjustBalance,
);
router.post(
  '/users/:userId/restrict',
  validateToken,
  requireAdmin,
  restrictUser,
);

module.exports = router;
