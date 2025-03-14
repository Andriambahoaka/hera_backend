const express = require('express');
const router = express.Router();

const packCtrl = require('../controllers/pack');

router.post('/',packCtrl.addPack);
router.get('/',packCtrl.getAllPacks);
router.post('/access',packCtrl.addOrUpdatePackAccess);

module.exports = router;