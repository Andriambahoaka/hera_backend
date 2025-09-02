// utils/messages.js
module.exports = {
  ERRORS: {
    // Auth & Tokens
    TOKEN_MISSING: "Token manquant ou mal formé.",
    TOKEN_INVALID: "Token invalide ou expiré.",
    OLD_PASSWORD_INCORRECT: "Ancien mot de passe incorrect.",
    EMAIL_REQUIRED: "Email requis.",
    PASSWORD_REQUIRED: "Mot de passe requis.",
    EMAIL_PASSWORD_REQUIRED: "Email et mot de passe requis.",
    OLD_NEW_PASSWORD_REQUIRED: "Ancien et nouveau mot de passe requis.",

    // User
    USER_NOT_FOUND: "Utilisateur non trouvé.",
    USER_NOT_FOUND_BY_EMAIL: "Utilisateur introuvable.",
    USER_TYPE_REQUIRED: "type_id et name sont requis.",
    USER_ID_REQUIRED: "userId requis.",

    // Device Token
    DEVICE_TOKEN_REQUIRED: "userId et deviceToken sont requis.",
    DEVICE_TOKEN_NOT_FOUND: "Token non trouvé dans la liste.",

    // Generic
    UNKNOWN_ERROR: "Une erreur interne est survenue.",
  },

  SUCCESS: {
    // User
    USER_UPDATED: "Utilisateur mis à jour avec succès.",
    USER_DELETED: "Utilisateur et accès au pack supprimés avec succès.",
    USERS_FETCHED: "Users récupérés avec succès",
    USERS_BY_OWNER_FETCHED: "Users par owner récupérés avec succès",
    USER_TYPE_CREATED: "UserType créé avec succès",

    // Password
    PASSWORD_UPDATED: "Mot de passe mis à jour",
    PASSWORD_RESET: "Mot de passe réinitialisé avec succès",

    // Image
    IMAGE_UPDATED: "Image utilisateur mise à jour avec succès",

    // Device Token
    TOKEN_ADDED: "Token ajouté avec succès.",
    TOKEN_DELETED: "Token supprimé avec succès.",
  },
};
