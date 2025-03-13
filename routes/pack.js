const express = require('express');
const router = express.Router();

const packCtrl = require('../controllers/pack');

router.post('/',packCtrl.addPack);

module.exports = router;