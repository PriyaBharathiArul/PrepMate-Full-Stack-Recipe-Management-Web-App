import express from 'express';
import models from '../models.js';

const router = express.Router();

function requireLogin(req, res, next) {
  if (!req.session?.user?._id) {
    return res.status(401).json({ message: 'Login required.' });
  }
  return next();
}

router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.get('/me/recipes', requireLogin, async (req, res) => {
  try {
    const recipes = await models.Recipe.find({ createdBy: req.session.user._id }).sort({ createdAt: -1 });
    return res.json({ recipes });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to load your recipes.', error: err.message });
  }
});

router.get('/me/liked', requireLogin, async (_req, res) => {
  return res.json({ recipes: [] });
});

router.get('/me/reviews', requireLogin, async (_req, res) => {
  return res.json({ reviews: [] });
});

export default router;
