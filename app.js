import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';

import usersRouter from './routes/users.js';
import recipesRouter from './routes/recipes.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import sessions from 'express-session';
import { WebAppAuthProvider } from 'msal-node-wrapper';
import models from './models.js';
import authRouter from './routes/auth.js';
import uploadRouter from './routes/upload.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const azure_secret = process.env.AZURE_AUTH_SECRET;
const azure_client_id = process.env.AZURE_CLIENT_ID;
const azure_authority_id = process.env.AZURE_AUTHORITY_ID;

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Session
const oneDay = 1000 * 60 * 60 * 24;
app.use(sessions({
  secret: azure_secret,
  saveUninitialized: true,
  cookie: { maxAge: oneDay },
  resave: false
}));

// Azure Auth Provider setup

const authProvider = await WebAppAuthProvider.initialize({
  auth: {
    authority: 'https://login.microsoftonline.com/' + azure_authority_id,
    clientId: azure_client_id,
    clientSecret: azure_secret,
    redirectUri: '/auth/redirect',
  }
});
app.use(authProvider.authenticate({ protectAllRoutes: false }));
app.use(async (req, res, next) => {
  const account = req.authContext?.getAccount();
  if (account && !req.session.user) {
    const email = account.username;
    const name = account.name || email.split('@')[0];
    console.log('account found:', email);

    try {
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
    } catch (err) {
      console.error('Error saving user to session:', err);
    }
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
// Make models accessible in req
app.use((req, res, next) => {
  req.models = models;
  next();
});
app.use('/users', usersRouter);
app.use('/api/users', usersRouter);
app.use('/auth', authRouter);
app.use('/api/recipes', recipesRouter);
app.use('/recipes', recipesRouter);
app.use('/api/upload', uploadRouter);
app.use(authProvider.interactionErrorHandler());
export default app;
