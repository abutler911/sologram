const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { cloudinary } = require("../config/cloudinary");
const AppError = require("../utils/AppError");
const {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiryDate,
  parseJwt,
} = require("../utils/tokenUtils");
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, username, email, password, bio } = req.body;

    // Create user
    let userData = {
      firstName,
      lastName,
      username,
      email,
      password,
      bio: bio || "",
    };

    if (req.file) {
      userData.profileImage = req.file.path;
      userData.cloudinaryId = req.file.filename;
    }

    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });

    // Set cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: refreshTokenExpiresAt,
    });

    res.status(201).json({
      success: true,
      accessToken,
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

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Log environment variables status (for debugging)
    console.log(`JWT_SECRET defined: ${!!process.env.JWT_SECRET}`);
    console.log(
      `JWT_REFRESH_SECRET defined: ${!!process.env.JWT_REFRESH_SECRET}`
    );

    // Find user
    const user = await User.findOne({ email }).select("+password");

    // Check if user exists and password is correct
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate tokens - with try/catch for better error handling
    let accessToken, refreshToken;
    try {
      accessToken = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET || "temp_dev_secret",
        { expiresIn: "15m" }
      );

      refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || "temp_refresh_secret",
        { expiresIn: "7d" }
      );
    } catch (err) {
      console.error("Token generation error:", err);
      return res.status(500).json({
        success: false,
        message: "Error generating authentication tokens",
      });
    }

    // Response object
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
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      // Clear refresh token in database
      await User.findByIdAndUpdate(req.user._id, {
        $unset: { refreshToken: 1, refreshTokenExpiresAt: 1 },
      });
    }

    // Clear refresh token cookie
    res.clearCookie("refreshToken");

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return next(new AppError("No refresh token provided", 401));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      return next(new AppError("Invalid or expired refresh token", 401));
    }

    // Find user by id and check if refresh token matches
    const user = await User.findById(decoded.id).select(
      "+refreshToken +refreshTokenExpiresAt"
    );

    if (!user || user.refreshToken !== refreshToken) {
      return next(new AppError("Invalid refresh token", 401));
    }

    // Check if refresh token is expired in DB (extra safety)
    if (user.refreshTokenExpiresAt < Date.now()) {
      return next(new AppError("Refresh token expired", 401));
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    const refreshTokenExpiresAt = getRefreshTokenExpiryDate();

    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpiresAt = refreshTokenExpiresAt;
    await user.save({ validateBeforeSave: false });

    // Set new refresh token cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: refreshTokenExpiresAt,
    });

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
      message: "Server Error",
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, email, bio } = req.body;

    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email is already taken",
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
    user.firstName = firstName || user.firstName || "Anonymous"; // fallback default if needed
    user.lastName = lastName || user.lastName;
    user.username = username || user.username;
    user.email = email || user.email;
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
    console.error(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.updateBio = async (req, res) => {
  try {
    const { bio } = req.body;

    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
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
    console.error("Bio update error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(err.errors)
          .map((val) => val.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.promoteToCreator = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.role = "creator";
    await user.save();

    res.status(200).json({
      success: true,
      message: "User promoted to creator successfully",
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Error promoting user:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
