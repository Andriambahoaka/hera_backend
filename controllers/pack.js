const Pack = require('../models/Pack');
const PackAccess = require('../models/PackAccess');

// Controller function to add a pack with devices
exports.addPack = (req, res, next) => {
    const { name, devices } = req.body;

    // Check if required fields are provided
    if (!name || !devices || !Array.isArray(devices)) {
        return res.status(400).json({ message: 'name and devices are required, and devices must be an array' });
    }

    // Check if devices array contains all required fields
    for (let device of devices) {
        if (!device.serialNumber || !device.name || !device.type || !device.type.name || !device.type.type_id) {
            return res.status(400).json({ message: 'Each device must have serialNumber, name, and type with name and type_id' });
        }
    }

    // Create a new Pack
    const newPack = new Pack({
        name,
        deviceList: devices
    });

    // Save the new pack to the database
    newPack.save()
        .then(() => res.status(201).json({ message: 'Pack created successfully', newPack }))
        .catch(error => res.status(400).json({ error: 'Error creating pack: ' + error.message }));
};

// Controller function to get all packs
exports.getAllPacks = (req, res, next) => {
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


exports.addPackAccess = async (req, res) => {
    const { userId, packId, access } = req.body;
  
    // Check if required fields are provided
    if (!userId || !packId || !access) {
      return res.status(400).json({ message: "userId, packId, and access are required" });
    }
  
    try {
      // Create a new PackAccess document
      const newPackAccess = new PackAccess({
        userId,
        packId,
        access
      });
  
      // Save the new PackAccess to the database
      await newPackAccess.save();
  
      // Return success response
      res.status(201).json({
        message: "PackAccess added successfully!",
        packAccess: newPackAccess
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error adding PackAccess", error });
    }
  };
