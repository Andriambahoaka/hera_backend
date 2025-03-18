const Pack = require('../models/Pack');
const PackAccess = require('../models/PackAccess');

// Controller function to add a pack with devices
exports.addPack = (req, res, next) => {
    const { ownerId, name, devices } = req.body;

    // Check if required fields are provided
    if (!name || !devices || !Array.isArray(devices)) {
        return res.status(400).json({ message: 'name and devices are required, and devices must be an array' });
    }

    // Check if devices array contains all required fields
    for (let device of devices) {
        if (!device.deviceId || !device.name || !device.type || !device.type.id) {
            return res.status(400).json({ message: 'Each device must have deviceId, name, and type with id' });
        }
    }

    // Create a new Pack
    const newPack = new Pack({
        ownerId: ownerId,
        name,
        devices: devices
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
    const { userId, packId, access } = req.body;

    // Vérification des champs requis
    if (!userId || !packId || !access) {
        return res.status(400).json({ message: "userId, packId, et access sont requis" });
    }

    try {
        // Vérifier si un accès existe déjà pour cet utilisateur et ce pack
        let packAccess = await PackAccess.findOne({ userId, packId });

        if (packAccess) {
            // Mettre à jour l'accès existant
            packAccess.access = access;
            await packAccess.save();
            return res.status(200).json({
                message: "PackAccess mis à jour avec succès !",
                packAccess
            });
        } else {
            // Créer un nouvel accès
            packAccess = new PackAccess({ userId, packId, access });
            await packAccess.save();
            return res.status(201).json({
                message: "PackAccess ajouté avec succès !",
                packAccess
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erreur lors de l'enregistrement du PackAccess", error });
    }
};

