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
        CREDENTIALS_INCORRECT : "Paire identifiant/mot de passe incorrect",

        // User
        USER_NOT_FOUND: "Utilisateur non trouvé.",
        USER_EXISTS: "Un utilisateur avec cet email existe déjà.",
        USER_NOT_FOUND_BY_EMAIL: "Utilisateur introuvable.",
        USER_TYPE_REQUIRED: "type_id et name sont requis.",
        USER_ID_REQUIRED: "userId requis.",

        // Device Token
        DEVICE_TOKEN_REQUIRED: "userId et deviceToken sont requis.",
        DEVICE_TOKEN_NOT_FOUND: "Token non trouvé dans la liste.",

        // Generic
        UNKNOWN_ERROR: "Une erreur interne est survenue.",


        INVALID_CREDENTIALS: "Identifiants invalides.",
        REFRESH_TOKEN_REQUIRED: "Refresh token requis.",
        INVALID_REFRESH_TOKEN: "Refresh token invalide ou expiré.",
        USER_ID_REQUIRED: "Identifiant utilisateur requis.",
        USER_NOT_FOUND: "Utilisateur non trouvé.",

        NOT_FOUND: "Ressource introuvable.",
    },

    SUCCESS: {
        // User
        USER_UPDATED: "Utilisateur mis à jour avec succès.",
        USER_DELETED: "Utilisateur et accès au pack supprimés avec succès.",
        USERS_FETCHED: "Users récupérés avec succès",
        USERS_BY_OWNER_FETCHED: "Users par owner récupérés avec succès",
        USER_TYPE_CREATED: "UserType créé avec succès",
        USER_CREATED: "Utilisateur créé avec succès.",
        LOGIN_SUCCESS: "Connexion réussie.",
        LOGOUT_SUCCESS: "Déconnexion réussie.",
        TOKEN_REFRESHED: "Nouveau jeton généré.",
        WELCOME_EMAIL_SUBJECT: "Hera App : Mot de passe temporaire",
        RESET_EMAIL_SUBJECT: "Réinitialisation du mot de passe",
        RESET_EMAIL_SENT: "Email de réinitialisation envoyé.",

        // Password
        PASSWORD_UPDATED: "Mot de passe mis à jour",
        PASSWORD_RESET: "Mot de passe réinitialisé avec succès",

        // Image
        IMAGE_UPDATED: "Image utilisateur mise à jour avec succès",

        // Device Token
        TOKEN_ADDED: "Token ajouté avec succès.",
        TOKEN_DELETED: "Token supprimé avec succès.",
    },

    APP: {
        MONGO_CONNECTED: "Connexion à MongoDB réussie !",
        MONGO_CONNECTION_ERROR: "Erreur de connexion à MongoDB :",
        SERVER_READY: "Serveur prêt sur le port",
        HEALTH_OK: "OK",
        DEEPLINK_TO_MISSING: 'Paramètre "to" manquant.',
        DEEPLINK_TO_INVALID: 'Paramètre "to" invalide.',
    },
};
