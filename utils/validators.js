const mongoose = require("mongoose");

exports.validateSignupInput = async (body, User) => {
    const { name, email, userType, ownerId } = body;

    // 1️⃣ Champs obligatoires
    if (!name || !email || !userType) {
        return "Les champs 'name', 'email' et 'userType' sont obligatoires.";
    }

    // 2️⃣ Format de l’adresse e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return "Le format de l'adresse e-mail est invalide.";
    }

    // 3️⃣ Type d’utilisateur
    const validUserTypes = [1, 2, 3];
    if (!validUserTypes.includes(userType)) {
        return "Le type d'utilisateur est invalide. Les valeurs possibles sont : 1 (propriétaire), 2 (administrateur) ou 3 (membre).";
    }

    // 4️⃣ Si userType = 2 ou 3, ownerId est obligatoire
    if ((userType === 2 || userType === 3) && !ownerId) {
        return "Le champ 'ownerId' est obligatoire pour les utilisateurs de type administrateur ou membre.";
    }

    // 5️⃣ Si userType = 2 ou 3, vérifier ownerId
    if ((userType === 2 || userType === 3) && ownerId) {
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            return "L'identifiant du propriétaire (ownerId) est invalide.";
        }

        const ownerUser = await User.findById(ownerId);
        if (!ownerUser) {
            return "Aucun utilisateur propriétaire n’a été trouvé avec cet identifiant.";
        }
    }

    if (userType === 1 && ownerId) {
        return "Le champ 'ownerId' doit être nul pour un utilisateur de type propriétaire.";
    }

    // ✅ Tout est valide
    return null;
};
