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

    if (!this.apiKey || !this.appId) {
      console.warn("OneSignal API key or App ID not provided");
    }
  }

  /**
   * Get OneSignal API headers
   */
  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.apiKey}`,
    };
  }

  /**
   * Get subscriber statistics from OneSignal
   */
  async getStats() {
    try {
      // Get app info from OneSignal
      const appResponse = await axios.get(
        `${ONESIGNAL_API_URL}/apps/${this.appId}`,
        { headers: this.getHeaders() }
      );

      // Get recent notifications
      const notificationsResponse = await axios.get(
        `${ONESIGNAL_API_URL}/notifications?app_id=${this.appId}&limit=20`,
        { headers: this.getHeaders() }
      );

      // Calculate stats
      const totalSubscribers = appResponse.data.players || 0;
      const activeSubscribers = Math.floor(totalSubscribers * 0.9); // Estimate based on typical engagement

      const notifications = notificationsResponse.data.notifications || [];
      const totalNotifications = notifications.length;

      // Calculate average open rate
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

      // Estimate growth (in a real implementation, you'd track this over time)
      const recentGrowth = 5.2; // Placeholder

      return {
        totalSubscribers,
        activeSubscribers,
        totalNotifications,
        openRate: parseFloat(openRate.toFixed(1)),
        lastSent,
        recentGrowth,
      };
    } catch (err) {
      console.error("Error fetching OneSignal stats:", err);
      // Fallback data
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
}

module.exports = new NotificationService();
