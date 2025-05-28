const Pack = require('../models/Pack');
const PackAccess = require('../models/PackAccess');

// Controller function to add a pack with devices
exports.addPack = (req, res, next) => {
  const { ownerId, deviceId, devicePassword } = req.body;

  // Check if required fields are provided
  if (!ownerId || !deviceId || !devicePassword) {
    return res.status(400).json({ message: 'OwnerId , deviceId and devicePassword are required' });
  }
  
  // Create a new Pack
  const newPack = new Pack({
    ownerId: ownerId,
    deviceId: deviceId,
    devicePassword: devicePassword
  });

  // Save the new pack to the database
  newPack.save()
    .then(() => res.status(201).json({ message: 'Pack created successfully', newPack }))
    .catch(error => res.status(400).json({ error: 'Error creating pack: ' + error.message, newPack }));
};

// Controller function to get all packs
exports.findAll = (req, res, next) => {
  // Use Mongoose to find all packs in the database
  Pack.find()
    .then(packs => {
      // If packs are found, return them
      res.status(200).json({ message: 'Packs retrieved successfully', packs });
    })
    .catch(error => {
      // If an error occurs, return an error message
      res.status(500).json({ error: 'Error retrieving packs: ' + error.message });
    });
};


exports.findAllByOwner = (req, res, next) => {
  const { ownerId } = req.params; // Récupération de l'ID du propriétaire depuis les paramètres de la requête

  if (!ownerId) {
    return res.status(400).json({ message: "L'ownerId est requis." });
  }

  Pack.find({ ownerId })
    .then(packs => {
      if (packs.length === 0) {
        return res.status(404).json({ message: "Aucun pack trouvé pour cet ownerId." });
      }
      res.status(200).json({ message: 'Packs récupérés avec succès', packs });
    })
    .catch(error => {
      res.status(500).json({ error: 'Erreur lors de la récupération des packs: ' + error.message });
    });
};


exports.addOrUpdatePackAccess = async (req, res) => {
  const accessList = req.body; // array of access entries from Flutter

  if (!Array.isArray(accessList) || accessList.length === 0) {
    return res.status(400).json({ message: "La liste d'accès est requise." });
  }

  try {
    const results = [];

    for (const accessItem of accessList) {
      const { userId, packId, hasAccess, access } = accessItem;

      if (!userId || !packId || typeof hasAccess !== "boolean" || !Array.isArray(access)) {
        results.push({ status: "error", message: `Entrée invalide: ${JSON.stringify(accessItem)}` });
        continue;
      }

      let packAccess = await PackAccess.findOne({ userId, packId });

      if (packAccess) {
        packAccess.hasAccess = hasAccess;
        packAccess.access = access;
        await packAccess.save();
        results.push({ status: "updated", packId });
      } else {
        packAccess = new PackAccess({ userId, packId, hasAccess, access });
        await packAccess.save();
        results.push({ status: "created", packId });
      }
    }

    return res.status(200).json({
      message: "PackAccess list processed successfully.",
      results,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur serveur lors du traitement des accès aux packs.",
      error: error.message,
    });
  }
};

exports.findAllPackAccessByUser = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "userId est requis." });
  }

  try {
    const accessList = await PackAccess.find({ userId });

    if (accessList.length === 0) {
      return res.status(404).json({ message: "Aucun accès trouvé pour cet utilisateur." });
    }

    res.status(200).json({
      message: "Accès trouvés avec succès.",
      accessList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des accès.",
      error: error.message
    });
  }
};



