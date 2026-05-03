const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

const uploadToCloudinary = (fileBuffer, userId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'mossPOK/avatars',
        public_id: userId.toString(),
        overwrite: true,
        transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        return resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Avatar file is required.' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, user._id);

    if (user.avatarPublicId && user.avatarPublicId !== uploadResult.public_id) {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    }

    user.avatarUrl = uploadResult.secure_url;
    user.avatarPublicId = uploadResult.public_id;
    await user.save();

    return res.status(200).json({ avatarUrl: user.avatarUrl });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to upload avatar.' });
  }
};

exports.getAvatars = async (req, res) => {
  try {
    const ids = req.query.ids
      ? req.query.ids.split(',').map((id) => id.trim()).filter(Boolean)
      : [];

    if (!ids.length) {
      return res.status(200).json({ avatars: {} });
    }

    const users = await User.find({ _id: { $in: ids } }).select('_id avatarUrl');
    const avatars = users.reduce((acc, user) => {
      acc[user._id] = user.avatarUrl || null;
      return acc;
    }, {});

    return res.status(200).json({ avatars });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to fetch avatars.' });
  }
};

exports.upgradePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    user.isPremium = true;
    await user.save();

    return res.status(200).json({ isPremium: user.isPremium });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Failed to upgrade premium.' });
  }
};
