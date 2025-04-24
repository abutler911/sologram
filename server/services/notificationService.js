// server/services/notificationService.js
const axios = require("axios");
const Notification = require("../models/Notification");
const User = require("../models/User");

class NotificationService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID;
    this.apiKey = process.env.ONESIGNAL_REST_API_KEY;
    this.oneSignalUrl = "https://onesignal.com/api/v1/notifications";

    if (!this.appId || !this.apiKey) {
      console.error(
        "NotificationService: Missing required environment variables"
      );
    }
  }

  /**
   * Get authorization headers for OneSignal API
   * @returns {Object} Headers object
   */
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.apiKey}`,
    };
  }

  /**
   * Get subscriber statistics from OneSignal
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    try {
      const appResponse = await axios.get(
        `https://onesignal.com/api/v1/apps/${this.appId}`,
        {
          headers: this.getHeaders(),
        }
      );

      // Get the most recent notification for timestamp
      const notificationsResponse = await axios.get(
        `https://onesignal.com/api/v1/notifications?app_id=${this.appId}&limit=1`,
        { headers: this.getHeaders() }
      );

      // Extract last notification timestamp if available
      let lastSent = null;
      if (notificationsResponse.data.notifications?.length > 0) {
        const timestamp =
          notificationsResponse.data.notifications[0].completed_at;
        if (timestamp && new Date(timestamp).getFullYear() > 2000) {
          lastSent = timestamp;
        }
      }

      return {
        totalSubscribers: appResponse.data.players || 0,
        lastNotificationSent: lastSent,
        platforms: await this.getPlatformDistribution(),
      };
    } catch (error) {
      console.error("Failed to get OneSignal stats:", error.message);
      return {
        totalSubscribers: 0,
        lastNotificationSent: null,
        platforms: {},
      };
    }
  }

  /**
   * Get platform distribution of subscribers
   * @returns {Promise<Object>} Platform distribution object
   */
  async getPlatformDistribution() {
    try {
      const response = await axios.get(
        `https://onesignal.com/api/v1/players?app_id=${this.appId}&limit=300`,
        { headers: this.getHeaders() }
      );

      // Count platforms
      const platforms = {};
      if (response.data.players) {
        response.data.players.forEach((player) => {
          const device = player.device_type || "unknown";
          platforms[device] = (platforms[device] || 0) + 1;
        });
      }

      return platforms;
    } catch (error) {
      console.error("Failed to get platform distribution:", error.message);
      return {};
    }
  }

  /**
   * Send a notification to all subscribers or filtered audience
   * @param {Object} options Notification options
   * @returns {Promise<Object>} Result object
   */
  async sendNotification(options) {
    try {
      const {
        title,
        message,
        url = null,
        icon = null,
        image = null,
        audience = "all",
        tags = [],
        scheduledFor = null,
      } = options;

      if (!title || !message) {
        throw new Error("Title and message are required");
      }

      // Base notification payload
      const payload = {
        app_id: this.appId,
        headings: { en: title },
        contents: { en: message },
      };

      // Add URL if provided
      if (url) {
        payload.url = url;
      }

      // Add optional fields if provided
      if (image) {
        payload.chrome_web_image = image;
        payload.firefox_icon = image;
        payload.chrome_icon = image;
      }

      if (icon) {
        payload.chrome_web_icon = icon;
        payload.firefox_icon = icon;
        payload.chrome_icon = icon;
      }

      // Target audience
      if (audience === "all") {
        payload.included_segments = ["All"];
      } else if (audience === "tags" && tags.length > 0) {
        payload.filters = tags.map((tag) => ({
          field: "tag",
          key: tag.key,
          relation: tag.relation || "=",
          value: tag.value,
        }));
      }

      // Schedule for later if specified
      if (scheduledFor) {
        const scheduledTime = new Date(scheduledFor);
        if (scheduledTime > new Date()) {
          payload.send_after = scheduledTime.toISOString();
        }
      }

      // Log the payload for debugging
      console.log(
        "[OneSignal] Sending notification payload:",
        JSON.stringify(payload, null, 2)
      );

      // Send to OneSignal
      const response = await axios.post(this.oneSignalUrl, payload, {
        headers: this.getHeaders(),
      });

      console.log("[OneSignal] Response:", response.data);

      // Create a record in our database
      const notification = new Notification({
        title,
        message,
        url,
        icon,
        image,
        audience,
        tags: Array.isArray(tags)
          ? tags.map((tag) => `${tag.key}:${tag.value}`)
          : [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: scheduledFor ? "scheduled" : "completed",
        sent: response.data.recipients || 0,
        oneSignalId: response.data.id,
        createdBy: options.userId || "000000000000000000000000", // Default to system user
      });

      await notification.save();

      return {
        success: true,
        recipients: response.data.recipients || 0,
        notificationId: notification._id,
        oneSignalId: response.data.id,
      };
    } catch (error) {
      console.error(
        "Failed to send notification:",
        error.response?.data || error.message
      );
      return {
        success: false,
        error: error.response?.data?.errors?.[0] || error.message,
      };
    }
  }

  /**
   * Send notification for a new post
   * @param {Object} post The post object
   * @returns {Promise<Object>} Result object
   */
  async notifyNewPost(post) {
    try {
      if (!post) {
        console.error("[OneSignal] Notification failed: No post data provided");
        return { success: false, error: "No post data provided" };
      }

      const title = "📸 New Post on SoloGram!";
      const message =
        post.caption?.slice(0, 120) || "Check out the latest post!";
      const url = `https://thesologram.com/post/${post._id}`;
      const image = post.media?.[0]?.mediaUrl;

      console.log("[OneSignal] Sending notification for new post:", post._id);

      return await this.sendNotification({
        title,
        message,
        url,
        image,
        userId: post.createdBy,
      });
    } catch (error) {
      console.error(
        "[OneSignal] Failed to notify about new post:",
        error.message
      );
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification history
   * @returns {Promise<Array>} Array of notifications
   */
  async getNotificationHistory() {
    try {
      // Get notifications from OneSignal
      const response = await axios.get(
        `https://onesignal.com/api/v1/notifications?app_id=${this.appId}&limit=50`,
        { headers: this.getHeaders() }
      );

      // Format and store in our database
      const notifications = [];

      if (response.data.notifications) {
        for (const notification of response.data.notifications) {
          // Look for existing record
          let existing = await Notification.findOne({
            oneSignalId: notification.id,
          });

          if (!existing) {
            // Create new record
            existing = new Notification({
              title: notification.headings?.en || "SoloGram Notification",
              message: notification.contents?.en || "",
              url: notification.url,
              oneSignalId: notification.id,
              sent: notification.successful || 0,
              opened: notification.converted || 0,
              createdAt: notification.completed_at
                ? new Date(notification.completed_at)
                : new Date(),
              status: "completed",
              createdBy: "000000000000000000000000", // System user
            });

            await existing.save();
          } else {
            // Update existing record
            existing.sent = notification.successful || 0;
            existing.opened = notification.converted || 0;
            if (existing.sent > 0) {
              existing.openRate = (existing.opened / existing.sent) * 100;
            }
            await existing.save();
          }

          notifications.push(existing);
        }
      }

      return notifications;
    } catch (error) {
      console.error("Failed to get notification history:", error.message);
      return [];
    }
  }

  /**
   * Cancel a scheduled notification
   * @param {string} notificationId The OneSignal notification ID
   * @returns {Promise<boolean>} Success indicator
   */
  async cancelNotification(notificationId) {
    try {
      await axios.delete(
        `https://onesignal.com/api/v1/notifications/${notificationId}?app_id=${this.appId}`,
        { headers: this.getHeaders() }
      );

      return true;
    } catch (error) {
      console.error("Failed to cancel notification:", error.message);
      return false;
    }
  }

  /**
   * Send a test notification
   * @returns {Promise<Object>} Result object
   */
  async sendTestNotification() {
    return await this.sendNotification({
      title: "Test Notification",
      message: "This is a test notification from SoloGram!",
      url: "https://thesologram.com",
      audience: "all",
    });
  }
}

module.exports = new NotificationService();
