const Pack = require('../models/Pack');
const PackAccess = require('../models/PackAccess');
const User = require('../models/User'); // modèle User pour vérifier l’existence du propriétaire


exports.addPack = async (req, res, next) => {
  try {
    const { ownerId, deviceId, deviceName, devicePassword } = req.body;

    // ✅ Vérification des champs requis
    if (!ownerId || !deviceId || !deviceName || !devicePassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Les champs ownerId, deviceId, deviceName et devicePassword sont obligatoires.'
      });
    }

    // ✅ Vérification si le propriétaire existe dans la base
    const owner = await User.findById(ownerId);
    if (!owner) {
      return res.status(404).json({
        status: 'error',
        message: "Le propriétaire spécifié n'existe pas dans la base de données."
      });
    }

    // ✅ Vérification du type d'utilisateur (doit être propriétaire)
    if (owner.userType !== 2 && owner.userType !== 3) {
      return res.status(403).json({
        status: 'error',
        message: "Seuls les utilisateurs de type propriétaire peuvent avoir un pack."
      });
    }

    // ✅ Création du pack
    const newPack = new Pack({
      ownerId,
      deviceId,
      deviceName,
      devicePassword
    });

    await newPack.save();

    // ✅ Réponse de succès
    return res.status(201).json({
      status: 'success',
      message: 'Pack ajouté avec succès.',
      data: newPack
    });

  } catch (error) {
    console.error('Erreur lors de la création du pack :', error);

    // ✅ Gestion des erreurs serveur
    return res.status(500).json({
      status: 'error',
      message: "Une erreur interne est survenue lors de l’ajout du pack.",
      error: error.message
    });
  }
};



// Controller function to update deviceName for multiple deviceIds
exports.updateDeviceNames = async (req, res, next) => {
  const { updates } = req.body;

  // Expecting: updates = [{ deviceId: 'id1', deviceName: 'Name1' }, ...]
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: 'Updates must be a non-empty array' });
  }

  try {
    // Use Promise.all to update each document one by one
    const results = await Promise.all(
      updates.map(({ deviceId, deviceName }) => {
        if (!deviceId || typeof deviceName !== 'string') {
          throw new Error('Each update must contain a valid deviceId and deviceName');
        }

        return Pack.updateOne(
          { deviceId },
          { $set: { deviceName } }
        );
      })
    );

    return res.status(200).json({
      message: 'Device names updated successfully',
      resultCount: results.length
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error updating device names: ' + error.message });
  }
};



exports.editUrgencyNumber = async (req, res, next) => {
  const { deviceId, urgencyNumber } = req.body;

  // Vérification des champs requis
  if (!deviceId) {
    return res.status(400).json({ message: 'deviceId is required' });
  }

  try {
    const updatedPack = await Pack.findOneAndUpdate(
      { deviceId: deviceId },
      { urgencyNumber: urgencyNumber ?? "17" }, // Si urgencyNumber est null/undefined, on met "17"
      { new: true } // Retourner le document mis à jour
    );

    if (!updatedPack) {
      return res.status(404).json({ message: 'Pack not found with the provided deviceId' });
    }

    res.status(200).json({ message: 'Urgency number updated successfully', updatedPack });
  } catch (error) {
    res.status(500).json({ error: 'Error updating urgency number: ' + error.message });
  }
};

// Controller function to get a pack by deviceId
exports.findByDeviceId = async (req, res, next) => {
  const { deviceId } = req.params;

  if (!deviceId) {
    return res.status(400).json({ message: 'deviceId parameter is required' });
  }

  try {
    const pack = await Pack.findOne({ deviceId });

    if (!pack) {
      return res.status(404).json({ message: 'No pack found with the provided deviceId' });
    }

    res.status(200).json(pack);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching pack: ' + error.message });
  }
};


// Controller function to update urgencyNumber and deviceName
exports.update = async (req, res, next) => {
  const { deviceId, urgencyNumber, deviceName } = req.body;

  // Validate required field
  if (!deviceId) {
    return res.status(400).json({ message: 'deviceId is required' });
  }

  // Build update object dynamically
  const updateFields = {};
  if (urgencyNumber !== undefined) updateFields.urgencyNumber = urgencyNumber || "17";
  if (deviceName !== undefined) updateFields.deviceName = deviceName;

  try {
    const updatedPack = await Pack.findOneAndUpdate(
      { deviceId: deviceId },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedPack) {
      return res.status(404).json({ message: 'Pack not found with the provided deviceId' });
    }

    res.status(200).json({ message: 'Pack updated successfully', updatedPack });
  } catch (error) {
    res.status(500).json({ error: 'Error updating pack: ' + error.message });
  }
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
    const accessList = await PackAccess.find({ userId })
      .populate('packId') // Populate the packId with full Pack document
      .lean(); // Convert Mongoose documents to plain JS objects

    if (accessList.length === 0) {
      return res.status(404).json({ message: "Aucun accès trouvé pour cet utilisateur." });
    }

    // Rename `packId` to `pack`
    const updatedAccessList = accessList.map(item => {
      const { packId, ...rest } = item;
      return {
        ...rest,
        pack: packId
      };
    });

    res.status(200).json({
      message: "Accès trouvés avec succès.",
      accessList: updatedAccessList
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des accès.",
      error: error.message
    });
  }
};




