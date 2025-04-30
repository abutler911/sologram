const Collection = require("../models/Collection");
const Post = require("../models/Post");
const { cloudinary } = require("../config/cloudinary");

exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections,
    });
  } catch (err) {
    console.error("Error fetching collections:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id).populate(
      "posts"
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (err) {
    console.error("Error fetching collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const collection = await Collection.create({
      name,
      description,
      isPublic: isPublic === "true",
      coverImage: req.file ? req.file.path : null,
      cloudinaryId: req.file ? req.file.filename : null,
    });

    res.status(201).json({
      success: true,
      data: collection,
    });
  } catch (err) {
    console.error("Error creating collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.updateCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    let collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    collection.name = name || collection.name;
    collection.description = description || collection.description;
    collection.isPublic = isPublic === "true";

    if (req.file) {
      if (collection.cloudinaryId) {
        await cloudinary.uploader.destroy(collection.cloudinaryId);
      }

      collection.coverImage = req.file.path;
      collection.cloudinaryId = req.file.filename;
    }

    await collection.save();

    res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (err) {
    console.error("Error updating collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (collection.cloudinaryId) {
      await cloudinary.uploader.destroy(collection.cloudinaryId);
    }

    await collection.deleteOne();

    res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.addPostToCollection = async (req, res) => {
  try {
    const { postId } = req.body;
    const collectionId = req.params.id;

    const post = await Post.findById(postId);
    const collection = await Collection.findById(collectionId);

    if (!post || !collection) {
      return res.status(404).json({
        success: false,
        message: "Post or collection not found",
      });
    }

    if (!collection.posts.includes(postId)) {
      collection.posts.push(postId);
      await collection.save();
    }

    if (!post.collections) {
      post.collections = [];
    }

    if (!post.collections.includes(collectionId)) {
      post.collections.push(collectionId);
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Post added to collection",
    });
  } catch (err) {
    console.error("Error adding post to collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.removePostFromCollection = async (req, res) => {
  try {
    const postId = req.params.postId;
    const collectionId = req.params.id;

    const post = await Post.findById(postId);
    const collection = await Collection.findById(collectionId);

    if (!post || !collection) {
      return res.status(404).json({
        success: false,
        message: "Post or collection not found",
      });
    }

    collection.posts = collection.posts.filter(
      (id) => id.toString() !== postId
    );
    await collection.save();

    if (post.collections) {
      post.collections = post.collections.filter(
        (id) => id.toString() !== collectionId
      );
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Post removed from collection",
    });
  } catch (err) {
    console.error("Error removing post from collection:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
