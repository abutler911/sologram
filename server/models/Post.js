const mongoose = require('mongoose');
const Collection = require('../models/Collection');
const Post = require('../models/Post');

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
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Update collection
exports.updateCollection = async (req, res) => {
  // Similar to create with findByIdAndUpdate
};

// Delete collection
exports.deleteCollection = async (req, res) => {
  // Implementation
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
    if (!post.collections.includes(collectionId)) {
      post.collections.push(collectionId);
      await post.save();
    }
    
    res.status(200).json({
      success: true,
      message: 'Post added to collection'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Remove post from collection
exports.removePostFromCollection = async (req, res) => {
  // Implementation
};


const PostSchema = new mongoose.Schema({
  caption: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    trim: true
  },
  media: [{
    mediaType: {
      type: String,
      enum: ['image', 'video', 'none'],
      default: 'none'
    },
    mediaUrl: {
      type: String
    },
    cloudinaryId: {
      type: String
    }
  }],
  likes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});


PostSchema.index({ caption: 'text', content: 'text', tags: 'text' });

module.exports = mongoose.model('Post', PostSchema);