// server/controllers/collections.js
const Collection = require('../models/Collection');
const Post = require('../models/Post');
const { cloudinary } = require('../config/cloudinary');

// Get all collections
exports.getCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: collections.length,
      data: collections
    });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Get single collection with posts
exports.getCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate('posts');
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (err) {
    console.error('Error fetching collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Create collection
exports.createCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    // Create collection
    const collection = await Collection.create({
      name,
      description,
      isPublic: isPublic === 'true',
      coverImage: req.file ? req.file.path : null,
      cloudinaryId: req.file ? req.file.filename : null
    });
    
    res.status(201).json({
      success: true,
      data: collection
    });
  } catch (err) {
    console.error('Error creating collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Update collection
exports.updateCollection = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    
    // Find collection
    let collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Update fields
    collection.name = name || collection.name;
    collection.description = description || collection.description;
    collection.isPublic = isPublic === 'true';
    
    // Update cover image if uploaded
    if (req.file) {
      // Delete old image if exists
      if (collection.cloudinaryId) {
        await cloudinary.uploader.destroy(collection.cloudinaryId);
      }
      
      collection.coverImage = req.file.path;
      collection.cloudinaryId = req.file.filename;
    }
    
    await collection.save();
    
    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (err) {
    console.error('Error updating collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Delete collection
exports.deleteCollection = async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }
    
    // Delete cover image if exists
    if (collection.cloudinaryId) {
      await cloudinary.uploader.destroy(collection.cloudinaryId);
    }
    
    await collection.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Add post to collection
exports.addPostToCollection = async (req, res) => {
  try {
    const { postId } = req.body;
    const collectionId = req.params.id;
    
    // Check if post and collection exist
    const post = await Post.findById(postId);
    const collection = await Collection.findById(collectionId);
    
    if (!post || !collection) {
      return res.status(404).json({
        success: false,
        message: 'Post or collection not found'
      });
    }
    
    // Add post to collection if not already there
    if (!collection.posts.includes(postId)) {
      collection.posts.push(postId);
      await collection.save();
    }
    
    // Add collection to post if not already there
    if (!post.collections) {
      post.collections = [];
    }
    
    if (!post.collections.includes(collectionId)) {
      post.collections.push(collectionId);
      await post.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Post added to collection'
    });
  } catch (err) {
    console.error('Error adding post to collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Remove post from collection
exports.removePostFromCollection = async (req, res) => {
  try {
    const postId = req.params.postId;
    const collectionId = req.params.id;
    
    // Check if post and collection exist
    const post = await Post.findById(postId);
    const collection = await Collection.findById(collectionId);
    
    if (!post || !collection) {
      return res.status(404).json({
        success: false,
        message: 'Post or collection not found'
      });
    }
    
    // Remove post from collection
    collection.posts = collection.posts.filter(
      id => id.toString() !== postId
    );
    await collection.save();
    
    // Remove collection from post
    if (post.collections) {
      post.collections = post.collections.filter(
        id => id.toString() !== collectionId
      );
      await post.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Post removed from collection'
    });
  } catch (err) {
    console.error('Error removing post from collection:', err);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};