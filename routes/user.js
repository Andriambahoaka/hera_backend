const express = require('express');
const router = express.Router();

const userCtrl = require('../controllers/user');

router.get('/',userCtrl.findAll);

module.exports = router;


