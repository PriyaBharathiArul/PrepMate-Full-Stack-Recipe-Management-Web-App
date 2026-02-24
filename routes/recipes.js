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
