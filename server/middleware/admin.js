const User = require('../models/User');

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('isAdmin');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ msg: 'Admin access required.' });
    }
    return next();
  } catch (error) {
    return res.status(500).json({ msg: 'Authorization failed.' });
  }
};
