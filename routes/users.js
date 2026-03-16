import express from 'express';
import models from '../models.js';

const router = express.Router();

// Require an authenticated session before returning user-specific data.
function requireLogin(req, res, next) {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: 'Login required.' });
  }
  return next();
}

router.get('/', function(req, res) {
  res.send('respond with a resource');
});

// Return recipes created by the logged-in user for the profile page.
router.get('/me/recipes', requireLogin, async (req, res) => {
  try {
    const recipes = await models.Recipe.find({ createdBy: req.session.user._id }).sort({ createdAt: -1 });
    return res.json({ recipes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your recipes.', error: err.message });
  }
});

// Return recipes the logged-in user has liked.
router.get('/me/liked', requireLogin, async (req, res) => {
  try {
    const favorites = await models.Favorite.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: 'recipeId',
        populate: {
          path: 'createdBy',
          select: 'username'
        }
      });

    const recipes = favorites
      .filter(fav => fav.recipeId) // Ignore likes that point to deleted recipes.
      .map(fav => fav.recipeId);

    return res.json({ recipes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load liked recipes.', error: err.message });
  }
});

// Return reviews written by the logged-in user.
router.get('/me/reviews', requireLogin, async (req, res) => {
  try {
    const comments = await models.Comment.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 })
      .populate('recipeId', 'title');

    const reviews = comments.map((c) => ({
      _id: c._id,
      rating: c.rating,
      comment: c.comment,
      createdAt: c.createdAt,
      recipe: c.recipeId
        ? {
            _id: c.recipeId._id,
            title: c.recipeId.title
          }
        : null
    }));

    return res.json({ reviews });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your reviews.', error: err.message });
  }
});

export default router;
