const Activity = require('../models/Activity');
exports.addActivity = async (req, res) => {
    try {
        const { ownerId, content, timeStamp } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Le contenu de l\'activité est requis.' });
        }

        const newActivity = new Activity({
            ownerId,
            content,
            timeStamp: timeStamp ? new Date(timeStamp) : undefined
        });
        const savedActivity = await newActivity.save();

        res.status(201).json({
            message: 'Activité ajoutée avec succès.',
            activity: savedActivity
        });

    } catch (error) {
        res.status(500).json({ error: 'Erreur serveur', details: error.message });
    }
};

exports.findActivitiesByDate = async (req, res) => {
  try {
    const { date, ownerId } = req.query;

    if (!date || !ownerId) {
      return res.status(400).json({ error: 'Les paramètres "date" et "ownerId" sont requis.' });
    }

    const activities = await Activity.findByDateAndOwner(date, ownerId);

    res.status(200).json(activities);

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};




