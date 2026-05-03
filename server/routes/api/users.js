const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { register } = require('../../controllers/users');
const validateToken = require('../../middleware/auth');
const upload = require('../../middleware/avatarUpload');
const {
  uploadAvatar,
  getAvatars,
  upgradePremium,
} = require('../../controllers/userController');

router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters',
    ).isLength({ min: 6 }),
  ],
  register,
);

router.post('/avatar', validateToken, upload.single('avatar'), uploadAvatar);
router.get('/avatars', validateToken, getAvatars);
router.post('/premium', validateToken, upgradePremium);

module.exports = router;
