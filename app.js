const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const userRoutes = require('./routes/user');

mongoose.connect('mongodb+srv://maheryj23:He06zvvoqJSlT88s@cluster0.xklfy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch((error) => console.log(error));

const app = express();


//progiciel 
//Intergiciels (« Middleware »)¶ Les intergiciels représentent un système de points d'entrée dans le traitement des requêtes et des réponses

//La méthode app.use() vous permet d'attribuer un middleware à une route spécifique de votre application.

//Le CORS définit comment les serveurs et les navigateurs interagissent, en spécifiant quelles ressources 
// peuvent être demandées de manière légitime – par défaut, 
// les requêtes AJAX sont interdites

// pas de routes afin de s'appliquer à toutes les routes
app.use((req, res, next) => {
  //d'accéder à notre API depuis n'importe quelle origine ( '*' ) ;
  res.setHeader('Access-Control-Allow-Origin', '*');
  //d'ajouter les headers mentionnés aux requêtes envoyées vers notre API (Origin , X-Requested-With , etc.) ;
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  //d'envoyer des requêtes avec les méthodes mentionnées ( GET ,POST , etc.).
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use(bodyParser.json());

app.use('/api/auth', userRoutes);

module.exports = app;