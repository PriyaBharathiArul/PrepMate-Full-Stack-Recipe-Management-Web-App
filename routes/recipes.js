import express from 'express';
import mongoose from 'mongoose';
import models from '../models.js';

const router = express.Router();

function normalizeRecipe(recipeDoc) {
  const recipe = recipeDoc.toObject ? recipeDoc.toObject() : recipeDoc;
  const steps = Array.isArray(recipe.steps)
    ? recipe.steps
    : Array.isArray(recipe.instructions)
      ? recipe.instructions
      : [];

  const createdBy = recipe.createdBy;
  const author = createdBy && typeof createdBy === 'object'
    ? { _id: createdBy._id, username: createdBy.username }
    : null;

  return {
    ...recipe,
    author,
    steps,
    instructions: steps
  };
}

function requireLogin(req, res, next) {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: 'Login required.' });
  }
  return next();
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const recipes = await models.Recipe.find(filter).sort({ createdAt: -1 }).populate('createdBy', 'username');
    return res.json({ recipes: recipes.map(normalizeRecipe) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recipes.', error: err.message });
  }
});

router.post('/', requireLogin, async (req, res) => {
  try {
    const steps = Array.isArray(req.body.steps)
      ? req.body.steps
      : Array.isArray(req.body.instructions)
        ? req.body.instructions
        : [];

    const payload = {
      title: req.body.title,
      description: req.body.description || '',
      category: req.body.category,
      ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : req.body.ingredients || [],
      steps,
      instructions: steps,
      imageUrl: req.body.imageUrl,
      prepTime: req.body.prepTime || 0,
      cookTime: req.body.cookTime || 0,
      servings: req.body.servings || 0,
      createdBy: req.session.user._id
    };

    if (!payload.title || !payload.category) {
      return res.status(400).json({ message: 'title and category are required.' });
    }

    const recipe = await models.Recipe.create(payload);
    const populated = await models.Recipe.findById(recipe._id).populate('createdBy', 'username');
    return res.status(201).json({ recipe: normalizeRecipe(populated) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create recipe.', error: err.message });
  }
});

// POST /api/recipes/:id/reviews - Add a review (rating + comment) to a recipe
router.post('/:id/reviews', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const recipe = await models.Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const review = await models.Comment.create({
      recipeId: req.params.id,
      userId: req.session.user._id,
      rating,
      comment: comment || ''
    });

    // Update average rating
    const allReviews = await models.Comment.find({ recipeId: req.params.id });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    recipe.avgRating = avgRating;
    await recipe.save();

    const populated = await models.Comment.findById(review._id).populate('userId', 'username email');
    return res.status(201).json({ review: populated });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to create review.', error: err.message });
  }
});

// GET /api/recipes/:id/reviews - Get all reviews for a recipe
router.get('/:id/reviews', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const reviews = await models.Comment.find({ recipeId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('userId', 'username email');

    // Format response to match frontend expectations
    const formattedReviews = reviews.map(r => ({
      _id: r._id,
      rating: r.rating,
      comment: r.comment,
      user: r.userId,
      createdAt: r.createdAt
    }));

    return res.json({ reviews: formattedReviews });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch reviews.', error: err.message });
  }
});

// POST /api/recipes/:id/like - Like a recipe
router.post('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const recipe = await models.Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    // Check if already liked
    const existing = await models.Favorite.findOne({
      userId: req.session.user._id,
      recipeId: req.params.id
    });

    if (existing) {
      return res.status(400).json({ message: 'Recipe already liked.' });
    }

    await models.Favorite.create({
      userId: req.session.user._id,
      recipeId: req.params.id
    });

    // Update like count
    recipe.likeCount = (recipe.likeCount || 0) + 1;
    await recipe.save();

    return res.status(201).json({ 
      message: 'Recipe liked.',
      likeCount: recipe.likeCount
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to like recipe.', error: err.message });
  }
});

// DELETE /api/recipes/:id/like - Unlike a recipe
router.delete('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const like = await models.Favorite.findOneAndDelete({
      userId: req.session.user._id,
      recipeId: req.params.id
    });

    if (!like) {
      return res.status(404).json({ message: 'Like not found.' });
    }

    // Update like count
    const recipe = await models.Recipe.findById(req.params.id);
    if (recipe) {
      recipe.likeCount = Math.max((recipe.likeCount || 0) - 1, 0);
      await recipe.save();
    }

    return res.json({ 
      message: 'Recipe unliked.',
      likeCount: recipe ? recipe.likeCount : 0
    });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to unlike recipe.', error: err.message });
  }
});

// GET /api/recipes/:id/liked - Check if current user has liked a recipe
router.get('/:id/liked', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const like = await models.Favorite.findOne({
      userId: req.session.user._id,
      recipeId: req.params.id
    });

    return res.json({ liked: !!like });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to check like status.', error: err.message });
  }
});

// GET /api/recipes/:id - Get a single recipe
router.get('/:id', async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const recipe = await models.Recipe.findById(req.params.id).populate('createdBy', 'username');
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    return res.json({ recipe: normalizeRecipe(recipe) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch recipe.', error: err.message });
  }
});

// PUT /api/recipes/:id - Update a recipe
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const recipe = await models.Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    if (recipe.createdBy.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own recipe.' });
    }

    const allowed = [
      'title',
      'description',
      'category',
      'ingredients',
      'steps',
      'instructions',
      'imageUrl',
      'prepTime',
      'cookTime',
      'servings'
    ];

    for (const key of allowed) {
      if (key in req.body) {
        recipe[key] = req.body[key];
      }
    }

    if ('steps' in req.body && !('instructions' in req.body)) {
      recipe.instructions = req.body.steps;
    }
    if ('instructions' in req.body && !('steps' in req.body)) {
      recipe.steps = req.body.instructions;
    }

    await recipe.save();
    const populated = await models.Recipe.findById(recipe._id).populate('createdBy', 'username');
    return res.json({ recipe: normalizeRecipe(populated) });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update recipe.', error: err.message });
  }
});

// DELETE /api/recipes/:id - Delete a recipe
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid recipe id.' });
    }

    const recipe = await models.Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found.' });
    }

    if (recipe.createdBy.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own recipe.' });
    }

    await models.Recipe.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete recipe.', error: err.message });
  }
});

export default router;
