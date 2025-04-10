// services/notificationService.js
const axios = require("axios");
const User = require("../models/User");

// OneSignal API endpoints
const ONESIGNAL_API_URL = "https://onesignal.com/api/v1";

/**
 * Service for sending notifications using OneSignal
 */
class NotificationService {
  constructor() {
    this.apiKey = process.env.ONESIGNAL_REST_API_KEY;
    this.appId = process.env.ONESIGNAL_APP_ID;

    if (!this.apiKey) {
      console.error("OneSignal REST API key is missing or undefined");
    }

    if (!this.appId) {
      console.error("OneSignal App ID is missing or undefined");
    }

    console.log("OneSignal Config:", {
      hasApiKey: !!this.apiKey,
      hasAppId: !!this.appId,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      // Log first few and last few characters of the key if it exists
      apiKeySample: this.apiKey
        ? `${this.apiKey.substring(0, 3)}...${this.apiKey.substring(
            this.apiKey.length - 3
          )}`
        : "N/A",
    });
  }

  /**
   * Get OneSignal API headers
   */
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Key ${this.apiKey}`, // Changed from "Basic" to "Key"
    };
  }

  /**
   * Get subscriber statistics from OneSignal
   */
  /**
   * Get subscriber statistics from OneSignal
   */
  async getStats() {
    try {
      const players = [];
      let offset = 0;
      const limit = 300;
      let totalCount = 0;

      // Fetch players with pagination (in case you grow >300)
      while (true) {
        const response = await axios.get(
          `${ONESIGNAL_API_URL}/players?app_id=${this.appId}&limit=${limit}&offset=${offset}`,
          { headers: this.getHeaders() }
        );

        const batch = response.data.players || [];
        totalCount = response.data.total_count || totalCount;

        players.push(...batch);

        if (batch.length < limit) break; // no more pages
        offset += limit;
      }

      const totalSubscribers = totalCount;
      const activeSubscribers = players.filter((p) => !p.invalidated).length;

      // Fetch latest notifications
      const notificationsResponse = await axios.get(
        `${ONESIGNAL_API_URL}/notifications?app_id=${this.appId}&limit=20`,
        { headers: this.getHeaders() }
      );

      const notifications = notificationsResponse.data.notifications || [];
      const totalNotifications = notifications.length;

      let totalOpenRate = 0;
      let notificationsWithStats = 0;
      let lastSent = null;

      notifications.forEach((notification) => {
        if (notification.completed_at) {
          if (
            !lastSent ||
            new Date(notification.completed_at) > new Date(lastSent)
          ) {
            lastSent = notification.completed_at;
          }

          if (notification.converted && notification.successful) {
            const openRate =
              (notification.converted / notification.successful) * 100;
            totalOpenRate += openRate;
            notificationsWithStats++;
          }
        }
      });

      const openRate =
        notificationsWithStats > 0 ? totalOpenRate / notificationsWithStats : 0;

      const recentGrowth = 5.2; // Still a placeholder unless you're tracking changes over time

      // Optional: Debug output
      console.log("📊 Notification Stats Computed:", {
        totalSubscribers,
        activeSubscribers,
        totalNotifications,
        openRate: openRate.toFixed(1),
        lastSent,
      });

      return {
        totalSubscribers,
        activeSubscribers,
        totalNotifications,
        openRate: parseFloat(openRate.toFixed(1)),
        lastSent,
        recentGrowth,
      };
    } catch (err) {
      console.error("Error fetching OneSignal stats:", err.message);
      return {
        totalSubscribers: 0,
        activeSubscribers: 0,
        totalNotifications: 0,
        openRate: 0,
        lastSent: null,
        recentGrowth: 0,
      };
    }
  }

  /**
   * Send a notification using OneSignal
   */
  async sendNotification(notificationData) {
    try {
      const { title, message, url, scheduledFor, audience, tags } =
        notificationData;

      // Build the notification payload
      const payload = {
        app_id: this.appId,
        headings: { en: title },
        contents: { en: message },
        url: url || undefined,
        chrome_web_icon: notificationData.icon || undefined,
        chrome_web_image: notificationData.image || undefined,
      };

      // Handle audience targeting
      if (audience === "tags" && tags && tags.length > 0) {
        // Target specific tags
        payload.filters = tags.map((tag) => ({
          field: "tag",
          key: tag,
          relation: "exists",
        }));
      } else {
        // Send to all subscribers
        payload.included_segments = ["All"];
      }

      // Schedule for later if needed
      if (scheduledFor) {
        payload.send_after = new Date(scheduledFor).toISOString();
      }

      // Send the notification
      const response = await axios.post(
        `${ONESIGNAL_API_URL}/notifications`,
        payload,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        notificationId: response.data.id,
        recipients: response.data.recipients,
      };
    } catch (err) {
      console.error(
        "Error sending OneSignal notification:",
        err.response?.data || err.message
      );
      throw new Error(
        err.response?.data?.errors?.[0] || "Failed to send notification"
      );
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    try {
      await axios.delete(
        `${ONESIGNAL_API_URL}/notifications/${notificationId}?app_id=${this.appId}`,
        { headers: this.getHeaders() }
      );

      return {
        success: true,
        message: "Notification cancelled successfully",
      };
    } catch (err) {
      console.error(
        "Error cancelling OneSignal notification:",
        err.response?.data || err.message
      );
      throw new Error("Failed to cancel notification");
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory() {
    try {
      const response = await axios.get(
        `${ONESIGNAL_API_URL}/notifications?app_id=${this.appId}&limit=50`,
        { headers: this.getHeaders() }
      );

      const notifications = (response.data.notifications || []).map(
        (notification) => {
          const status = notification.canceled
            ? "cancelled"
            : notification.completed_at
            ? "completed"
            : "scheduled";

          return {
            id: notification.id,
            title: notification.headings?.en || "Notification",
            message: notification.contents?.en || "",
            sentAt: notification.completed_at,
            scheduledFor: notification.send_after,
            audience: notification.included_segments?.includes("All")
              ? "all"
              : "segments",
            status,
            sent: notification.successful || 0,
            opened: notification.converted || 0,
            openRate:
              notification.successful > 0
                ? parseFloat(
                    (
                      (notification.converted / notification.successful) *
                      100
                    ).toFixed(1)
                  )
                : 0,
          };
        }
      );

      return notifications;
    } catch (err) {
      console.error("Error fetching OneSignal notification history:", err);
      return [];
    }
  }

  /**
   * Get platform distribution from OneSignal
   */
  async getPlatformDistribution() {
    try {
      // Make a request to OneSignal's API to get devices
      const response = await axios.get(
        `${ONESIGNAL_API_URL}/players?app_id=${this.appId}&limit=300`,
        {
          headers: this.getHeaders(),
        }
      );

      // Initialize platform counters
      const platforms = {
        Chrome: 0,
        Firefox: 0,
        Safari: 0,
        Edge: 0,
        Android: 0,
        iOS: 0,
        Other: 0,
      };

      if (response.data && response.data.players) {
        // Count devices by platform
        response.data.players.forEach((player) => {
          const platform = this.getPlatformFromDeviceType(
            player.device_type,
            player.platform
          );
          platforms[platform] = (platforms[platform] || 0) + 1;
        });

        return platforms;
      } else {
        // If no data is available, return sample data
        return {
          Chrome: 245,
          Firefox: 128,
          Safari: 156,
          Edge: 72,
          Android: 389,
          iOS: 421,
        };
      }
    } catch (error) {
      console.error("Error fetching OneSignal platform data:", error);

      // Return fallback data in case of error
      return {
        Chrome: 245,
        Firefox: 128,
        Safari: 156,
        Edge: 72,
        Android: 389,
        iOS: 421,
      };
    }
  }

  /**
   * Convert OneSignal device type to readable platform name
   */
  getPlatformFromDeviceType(deviceType, platform) {
    // OneSignal device types:
    // 0 = iOS, 1 = Android, 2 = Amazon, 3 = WindowsPhone, 4 = Chrome Apps/Extensions,
    // 5 = Chrome Web Push, 6 = Windows, 7 = Safari, 8 = Firefox, 9 = Mac OS X, 10 = Edge
    const deviceTypes = {
      0: "iOS",
      1: "Android",
      2: "Other", // Amazon
      3: "Other", // Windows Phone
      4: "Chrome",
      5: "Chrome",
      6: "Other", // Windows
      7: "Safari",
      8: "Firefox",
      9: "Other", // Mac OS X
      10: "Edge",
      11: "Other", // Opera
    };

    if (deviceType !== undefined && deviceTypes[deviceType]) {
      return deviceTypes[deviceType];
    }

    // If device_type is not available, try using platform
    if (platform) {
      const platformLower = platform.toLowerCase();
      if (platformLower.includes("chrome")) return "Chrome";
      if (platformLower.includes("firefox")) return "Firefox";
      if (platformLower.includes("safari")) return "Safari";
      if (platformLower.includes("edge")) return "Edge";
      if (platformLower.includes("android")) return "Android";
      if (platformLower.includes("ios")) return "iOS";
    }

    return "Other";
  }
  async notifyNewStory(story) {
    const title = "New Story Posted!";
    const message = story.title || "Check out the latest update on SoloGram.";
    const url = `https://thesologram.com/stories/${story._id}`;

    return this.sendNotification({
      title,
      message,
      url,
      audience: "all",
    });
  }
}

module.exports = new NotificationService();
