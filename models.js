import mongoose from 'mongoose';

let models = {};

main().catch(err => console.error(err));

async function main() {
  console.log('connecting to mongodb...');

  await mongoose.connect(
    'mongodb+srv://1605673803qr_db_user:fjwrvB0V7JlGu8AX@cluster0.e3kwdmb.mongodb.net/prepMate'
  );

  console.log('successfully connected to mongodb!');

  /* ======================
     User Schema
  ====================== */

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
    password: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  models.User = mongoose.model('User', userSchema);

  /* ======================
     Recipe Schema
  ====================== */

  const recipeSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    description: String,
    category: String,

    ingredients: {
      type: mongoose.Schema.Types.Mixed, // JSON files
      default: {}
    },

    instructions: {
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

    createdAt: {
      type: Date,
      default: Date.now
    }
  });

  models.Recipe = mongoose.model('Recipe', recipeSchema);

  /* ======================
     Comment Schema
  ====================== */

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

  models.Comment = mongoose.model('Comment', commentSchema);

  console.log('mongoose models created!');
}

export default models;
