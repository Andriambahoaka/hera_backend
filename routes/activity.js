const express = require('express');
const router = express.Router();

const activityCtrl = require('../controllers/activity');

router.post('/', activityCtrl.addActivity);
router.get('/byDate', activityCtrl.findActivitiesByDate);

module.exports = router;