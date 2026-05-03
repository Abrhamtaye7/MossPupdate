const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { getActiveRooms, tables } = require('../socket/roomStore');

const buildDateRange = (days) => {
  const dates = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(date);
  }
  return dates;
};

exports.getDashboardMetrics = async (req, res) => {
  try {
    const totalLiquidityAgg = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$chipsAmount' } } },
    ]);
    const totalLiquidity = totalLiquidityAgg.length
      ? totalLiquidityAgg[0].total
      : 0;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todaysRevenueAgg = await Transaction.aggregate([
      { $match: { type: 'rake', createdAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const todaysRevenue = todaysRevenueAgg.length
      ? todaysRevenueAgg[0].total
      : 0;

    const pendingApprovals = await Transaction.countDocuments({
      status: 'pending',
      type: { $in: ['deposit', 'withdrawal'] },
    });

    const activeGames = getActiveRooms().length;

    return res.status(200).json({
      totalLiquidity,
      todaysRevenue,
      activeGames,
      pendingApprovals,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load metrics.' });
  }
};

exports.getRevenueSeries = async (req, res) => {
  try {
    const days = buildDateRange(30);
    const start = days[0];

    const revenue = await Transaction.aggregate([
      { $match: { type: 'rake', createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    const daily = days.map((day) => {
      const match = revenue.find(
        (entry) =>
          entry._id.year === day.getFullYear() &&
          entry._id.month === day.getMonth() + 1 &&
          entry._id.day === day.getDate(),
      );
      return {
        date: day.toISOString().slice(0, 10),
        revenue: match ? match.total : 0,
      };
    });

    const monthly = daily.reduce((acc, entry) => {
      const month = entry.date.slice(0, 7);
      acc[month] = (acc[month] || 0) + entry.revenue;
      return acc;
    }, {});

    const monthlySeries = Object.keys(monthly).map((month) => ({
      month,
      revenue: monthly[month],
    }));

    const rooms = Object.values(tables);
    const tierRevenue = rooms.map((room) => ({
      tier: room.tier,
      revenue: room.pot || 0,
    }));

    return res.status(200).json({ daily, monthly: monthlySeries, tierRevenue });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load revenue series.' });
  }
};

exports.getRecentTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'name email');
    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load transactions.' });
  }
};

exports.getActiveRooms = async (req, res) => {
  try {
    const rooms = getActiveRooms().map((room) => ({
      id: room.id,
      name: room.name,
      tier: room.tier,
      playerCount: room.players.length,
      status: room.status,
    }));
    return res.status(200).json(rooms);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load rooms.' });
  }
};

exports.getApprovalQueue = async (req, res) => {
  try {
    const { type } = req.query;
    const query = {
      status: 'pending',
      type: type ? type : { $in: ['deposit', 'withdrawal'] },
    };
    const approvals = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    return res.status(200).json(approvals);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load approvals.' });
  }
};

exports.approveTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id).populate(
      'user',
    );
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found.' });
    }
    transaction.status = 'approved';
    await transaction.save();
    if (transaction.type === 'deposit') {
      transaction.user.chipsAmount += transaction.amount;
    }
    if (transaction.type === 'withdrawal') {
      transaction.user.chipsAmount -= transaction.amount;
    }
    await transaction.user.save();
    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to approve.' });
  }
};

exports.rejectTransaction = async (req, res) => {
  try {
    const { reason } = req.body;
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ msg: 'Transaction not found.' });
    }
    transaction.status = 'rejected';
    transaction.reason = reason || transaction.reason;
    await transaction.save();
    return res.status(200).json(transaction);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to reject.' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.query || '';
    const regex = new RegExp(query, 'i');
    const users = await User.find({
      $or: [{ name: regex }, { phone: regex }],
    }).select('-password');
    return res.status(200).json(users);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to search users.' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    const transactions = await Transaction.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const activeTable = Object.values(tables).find((table) =>
      Object.values(table.seats).some(
        (seat) => seat && seat.player.id.toString() === user._id.toString(),
      ),
    );
    const gameHistory = activeTable ? activeTable.history.slice(-50) : [];

    return res.status(200).json({
      user,
      transactions,
      gameHistory,
      ipLog: user.ipLog || [],
      collusionFlags: user.collusionFlags || [],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to load user details.' });
  }
};

exports.adjustBalance = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }
    user.chipsAmount += Number(amount);
    await user.save();

    const transaction = await Transaction.create({
      user: user._id,
      type: 'adjustment',
      amount: Number(amount),
      status: 'approved',
      reason,
    });

    return res.status(200).json({ user, transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to adjust balance.' });
  }
};

exports.restrictUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }
    user.isRestricted = true;
    await user.save();
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to restrict user.' });
  }
};
