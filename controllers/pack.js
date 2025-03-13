const Pack = require('../models/Pack');

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
