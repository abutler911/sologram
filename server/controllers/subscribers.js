const Subscriber = require("../models/Subscriber");
const crypto = require("crypto");
const { sendSMS } = require("../services/smsService");

// Subscribe to notifications
exports.subscribe = async (req, res) => {
  try {
    const { phone, name } = req.body;

    // Check if already subscribed
    let subscriber = await Subscriber.findOne({ phone });

    if (subscriber) {
      // If subscriber exists but inactive, reactivate
      if (!subscriber.isActive) {
        subscriber.isActive = true;
        subscriber.name = name;
        await subscriber.save();
        return res.status(200).json({
          success: true,
          message: "Your subscription has been reactivated",
          data: {
            phone: subscriber.phone,
            name: subscriber.name,
          },
        });
      }

      // Already subscribed and active
      return res.status(400).json({
        success: false,
        message: "This phone number is already subscribed",
      });
    }

    // Generate verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create new subscriber
    subscriber = await Subscriber.create({
      phone,
      name,
      verificationCode,
      verificationExpires,
      isVerified: false,
    });

    // Send verification SMS
    try {
      await sendSMS(
        phone,
        `Your SoloGram verification code is: ${verificationCode}. It expires in 10 minutes.`
      );
    } catch (smsError) {
      console.error("Error sending verification SMS:", smsError);
      await Subscriber.findByIdAndDelete(subscriber._id);

      return res.status(500).json({
        success: false,
        message: "Failed to send verification SMS. Please try again later.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Please verify your phone number with the code sent via SMS",
      data: {
        phone: subscriber.phone,
      },
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Verify phone number
exports.verifyPhone = async (req, res) => {
  try {
    const { phone, code } = req.body;

    const subscriber = await Subscriber.findOne({
      phone,
      verificationCode: code,
      verificationExpires: { $gt: new Date() },
    });

    if (!subscriber) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
    }

    // Mark as verified and clear verification data
    subscriber.isVerified = true;
    subscriber.verificationCode = undefined;
    subscriber.verificationExpires = undefined;
    await subscriber.save();

    // Send welcome message
    try {
      await sendSMS(
        phone,
        `Welcome to SoloGram notifications! You'll now receive updates when new content is posted. Reply STOP at any time to unsubscribe.`
      );
    } catch (smsError) {
      console.error("Error sending welcome SMS:", smsError);
      // Not critical, continue even if welcome SMS fails
    }

    res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Unsubscribe from notifications
exports.unsubscribe = async (req, res) => {
  try {
    const { phone } = req.body;

    const subscriber = await Subscriber.findOne({ phone });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    // Mark as inactive instead of deleting to preserve history
    subscriber.isActive = false;
    await subscriber.save();

    // Send confirmation SMS
    try {
      await sendSMS(
        phone,
        "You've been unsubscribed from SoloGram notifications. We hope to see you again soon!"
      );
    } catch (smsError) {
      console.error("Error sending unsubscribe confirmation SMS:", smsError);
      // Not critical, continue even if SMS fails
    }

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from notifications",
    });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Resend verification code
exports.resendVerification = async (req, res) => {
  try {
    const { phone } = req.body;

    const subscriber = await Subscriber.findOne({ phone, isVerified: false });

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Subscriber not found or already verified",
      });
    }

    // Generate new verification code
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    subscriber.verificationCode = verificationCode;
    subscriber.verificationExpires = verificationExpires;
    await subscriber.save();

    // Send verification SMS
    try {
      await sendSMS(
        phone,
        `Your SoloGram verification code is: ${verificationCode}. It expires in 10 minutes.`
      );
    } catch (smsError) {
      console.error("Error sending verification SMS:", smsError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification SMS. Please try again later.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code resent",
    });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Admin only: Get all subscribers
exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await Subscriber.find({ isVerified: true })
      .sort({ createdAt: -1 })
      .select("phone name isActive lastNotified createdAt");

    res.status(200).json({
      success: true,
      count: subscribers.length,
      data: subscribers,
    });
  } catch (err) {
    console.error("Get subscribers error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
