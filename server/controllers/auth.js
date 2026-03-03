// server/controllers/auth.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinary');
const AppError = require('../utils/AppError');
const { logger } = require('../utils/logger');

const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  parseJwt,
} = require('../utils/tokenUtils');

const { sendEmail } = require('../utils/sendEmail');
const {
  buildWelcomeEmail,
} = require('../utils/emailTemplates/welcomeTemplate');
const {
  buildPromotionEmail,
} = require('../utils/emailTemplates/promotionTemplate');
const {
  buildProfileUpdateEmail,
} = require('../utils/emailTemplates/profileUpdateTemplate');

// ── Register ─────────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, bio } = req.body;

    let userData = {
      firstName,
      lastName,
      username,
      email,
      password,
      bio: bio || '',
    };

    if (req.file) {
      userData.profileImage = req.file.path;
      userData.cloudinaryId = req.file.filename;
    }

    const user = await User.create(userData);

    logger.info('New user registered', {
      context: {
        event: 'user_register',
        userId: user._id.toString(),
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

    // Save refresh token to DB
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });

    // Send welcome email (fire-and-forget)
    sendEmail({
      to: user.email,
      subject: `🎉 Welcome to SoloGram, ${user.firstName || user.username}!`,
      html: buildWelcomeEmail({
        name: user.firstName || user.username,
      }),
    }).catch((err) =>
      logger.error('Welcome email failed', { error: err.message })
    );

    // Set refresh token cookie (httpOnly backup — client also stores in body)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: refreshTokenExpiresAt,
    });

    res.status(201).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ────────────────────────────────────────────────────────────────────

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      logger.warn('Login attempt failed', {
        context: {
          event: 'login_failed',
          email,
          ip: req.ip,
        },
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate tokens via tokenUtils (365d refresh)
    let accessToken, refreshToken;
    try {
      accessToken = generateAccessToken(user._id);
      refreshToken = generateRefreshToken(user._id);
    } catch (err) {
      console.error('Token generation error:', err);
      return res.status(500).json({
        success: false,
        message: 'Error generating authentication tokens',
      });
    }

    // ── Save refresh token to DB (this was missing!) ──────────────────
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();
    await User.findByIdAndUpdate(user._id, {
      refreshToken,
      refreshTokenExpiresAt,
      lastLogin: Date.now(),
    });

    logger.info('User login successful', {
      context: {
        event: 'user_login',
        userId: user._id.toString(),
        email: user.email,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    // Set refresh token cookie (httpOnly backup)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: refreshTokenExpiresAt,
    });

    user.password = undefined;

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// ── Logout ───────────────────────────────────────────────────────────────────

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1, refreshTokenExpiresAt: 1 },
      });
    }

    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ────────────────────────────────────────────────────────────

exports.refreshToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return next(new AppError('No refresh token provided', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new AppError('Invalid or expired refresh token', 401));
    }

    const user = await User.findById(decoded.id).select(
      '+refreshToken +refreshTokenExpiresAt'
    );

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError('Invalid refresh token', 401));
    }

    if (user.refreshTokenExpiresAt < Date.now()) {
      return next(new AppError('Refresh token expired', 401));
    }

    // Rotate: new access + new refresh
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: refreshTokenExpiresAt,
    });

    // Return both tokens — client stores new refresh token
    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── Get Me ───────────────────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// ── Update Profile ───────────────────────────────────────────────────────────

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email, bio } = req.body;

    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken',
        });
      }
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
    }

    if (req.file) {
      if (user.cloudinaryId) {
        await cloudinary.uploader.destroy(user.cloudinaryId);
      }
      user.profileImage = req.file.path;
      user.cloudinaryId = req.file.filename;
    }

    user.firstName = firstName || user.firstName || 'Anonymous';
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio === undefined ? user.bio : bio;

    await user.save();

    logger.info('User profile updated', {
      context: {
        event: 'profile_update',
        userId: user._id.toString(),
        email: user.email,
        ip: req.ip,
      },
    });

    sendEmail({
      to: user.email,
      subject: `✅ Your profile has been updated`,
      html: buildProfileUpdateEmail({
        name: user.firstName || user.username,
        action: 'profile',
      }),
    }).catch((err) =>
      logger.error('Profile update email failed', { error: err.message })
    );

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// ── Update Bio ───────────────────────────────────────────────────────────────

exports.updateBio = async (req, res) => {
  try {
    const { bio } = req.body;

    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.bio = bio === undefined ? user.bio : bio;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Bio update error:', err);

    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// ── Promote to Creator ───────────────────────────────────────────────────────

exports.promoteToCreator = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.role = 'creator';
    await user.save();

    logger.info('User promoted to creator', {
      context: {
        event: 'role_change',
        userId: user._id.toString(),
        newRole: 'creator',
        email: user.email,
        ip: req.ip,
      },
    });

    sendEmail({
      to: user.email,
      subject: `🌟 You're now a Creator on SoloGram!`,
      html: buildPromotionEmail({
        name: user.firstName || user.username,
      }),
    }).catch((err) =>
      logger.error('Promotion email failed', { error: err.message })
    );

    res.status(200).json({
      success: true,
      message: 'User promoted to creator successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Error promoting user:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
