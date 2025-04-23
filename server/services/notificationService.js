// services/notificationService.js
const axios = require("axios");
const User = require("../models/User");
const Notification = require("../models/Notification");

const ONE_SIGNAL_URL = "https://onesignal.com/api/v1/notifications";

class NotificationService {
  constructor() {
    this.appId = process.env.ONESIGNAL_APP_ID;
    this.apiKey = process.env.ONESIGNAL_REST_API_KEY;
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: `Basic ${this.apiKey}`,
    };
  }

  // 🎯 Send to specific user (targeted)
  async sendToUser(userId, title, message, url, image = null) {
    const user = await User.findById(userId);
    if (!user?.oneSignalPlayerId) throw new Error("No player ID for user");

    const payload = {
      app_id: this.appId,
      headings: { en: title },
      contents: { en: message },
      url,
      chrome_web_image: image || undefined,
      include_external_user_ids: [userId.toString()],
    };

    const response = await axios.post(ONE_SIGNAL_URL, payload, {
      headers: this.getHeaders(),
    });

    return response.data;
  }

  // 📢 Broadcast to all users
  async broadcast(title, message, url, image = null) {
    const payload = {
      app_id: this.appId,
      headings: { en: title },
      contents: { en: message },
      url,
      chrome_web_image: image || undefined,
      included_segments: ["All"],
    };

    const response = await axios.post(ONE_SIGNAL_URL, payload, {
      headers: this.getHeaders(),
    });

    return response.data;
  }

  // 📚 Post Notification
  async notifyNewPost(post) {
    const title = "📸 New Post on SoloGram!";
    const message = post.caption?.slice(0, 120) || "Check out the latest post!";
    const url = `https://thesologram.com/posts/${post._id}`;
    const image = post.media?.[0]?.mediaUrl;

    const result = await this.broadcast(title, message, url, image);

    await Notification.create({
      title,
      message,
      url,
      image,
      type: "post",
      audience: "all",
      sent: result.recipients || 0,
      opened: 0,
      isTemplate: false,
      post: post._id,
      createdBy: post.createdBy || "000000000000000000000000",
    });

    return result;
  }

  // 🎭 Thought Notification
  async notifyNewThought(thought) {
    const title = "💭 New Thought on SoloGram";
    const message =
      thought.content.slice(0, 100) +
      (thought.content.length > 100 ? "..." : "");
    const url = `https://thesologram.com/thoughts/${thought._id}`;
    const image = thought.media?.mediaUrl;

    const result = await this.broadcast(title, message, url, image);

    await Notification.create({
      title,
      message,
      url,
      image,
      type: "thought",
      audience: "all",
      sent: result.recipients || 0,
      opened: 0,
      isTemplate: false,
      thought: thought._id,
      createdBy: thought.createdBy || "000000000000000000000000",
    });

    return result;
  }

  // 🎥 Story Notification
  async notifyNewStory(story) {
    const title = "📢 New Story on SoloGram!";
    const message = story.title || "Check out the latest story!";
    const url = `https://thesologram.com/stories/${story._id}`;
    const image = story.media?.[0]?.mediaUrl;

    const result = await this.broadcast(title, message, url, image);

    await Notification.create({
      title,
      message,
      url,
      image,
      type: "story",
      audience: "all",
      sent: result.recipients || 0,
      opened: 0,
      isTemplate: false,
      story: story._id,
      createdBy: story.createdBy || "000000000000000000000000",
    });

    return result;
  }
}

module.exports = new NotificationService();
