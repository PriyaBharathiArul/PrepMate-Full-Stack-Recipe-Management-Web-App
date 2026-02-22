import express from 'express';
import models from '../models.js';

const router = express.Router();

// sign in
router.get('/signin', (req, res, next) => {
  return req.authContext.login({
    postLoginRedirectUri: "/",
  })(req, res, next);
});

// sign out
router.get('/signout', (req, res, next) => {
  return req.authContext.logout({
    postLogoutRedirectUri: "/",
  })(req, res, next);
});

// Azure AD redirect callback
router.post('/redirect', async (req, res, next) => {
  const account = req.authContext?.getAccount();
  console.log('account:', account); 
  
  if (account) {
    const email = account.username;
    const name = account.name || email.split('@')[0];

    let user = await models.User.findOne({ email });
    if (!user) {
      user = await models.User.create({ username: name, email });
    }

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    };

    console.log('session.user set:', req.session.user); 
  }
  res.redirect('/');
});

// get current user
router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }
  res.json({ user: req.session.user });
});

export default router;