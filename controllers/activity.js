const Activity = require('../models/Activity');
exports.addActivity = async (req, res) => {
    try {
        const { ownerId, content} = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Le contenu de l\'activité est requis.' });
        }

        const newActivity = new Activity({
            ownerId,
            content
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

    if (!ownerId) {
      return res.status(400).json({ error: 'Le paramètre "ownerId" est requis.' });
    }

    let activities;

    if (date) {
      // Si une date est fournie, on filtre par date et propriétaire
      activities = await Activity.findByDateAndOwner(date, ownerId);
    } else {
      // Sinon, on récupère toutes les activités du propriétaire
      activities = await Activity.find({ ownerId }).sort({ createdAt: -1 });
    }

    res.status(200).json(activities);

  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
};





