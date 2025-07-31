const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const userTypeRoutes = require('./routes/userType');
const packRoutes = require('./routes/pack');
const notificationRoutes = require('./routes/notification');
const activityRoutes = require('./routes/activity');
const path = require('path');

require('dotenv').config();

mongoose.connect('mongodb+srv://maheryj23:He06zvvoqJSlT88s@cluster0.xklfy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.log(error));

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(bodyParser.json());

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/userType', userTypeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/packs', packRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);


app.get('/deeplink', (req, res) => {
  const to = req.query.to;

  if (!to) {
    return res.status(400).send('Paramètre "to" manquant.');
  }

  const deepLink = `hera://${to}`;
  res.redirect(deepLink);
});

app.listen(4200, () => console.log("Server ready on port 4200")); 

module.exports = app;