import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/PrepMate';

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('successfully connected to mongodb'))
  .catch((err) => console.error('mongodb connection error:', err));

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: true
  },
  ingredients: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  instructions: {
    type: [String],
    default: []
  },
  steps: {
    type: [String],
    default: []
  },
  imageUrl: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  favoritesCount: {
    type: Number,
    default: 0
  },
  prepTime: {
    type: Number,
    default: 0
  },
  cookTime: {
    type: Number,
    default: 0
  },
  servings: {
    type: Number,
    default: 0
  },
  avgRating: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const commentSchema = new mongoose.Schema({
  recipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

export default { User, Recipe, Comment };
