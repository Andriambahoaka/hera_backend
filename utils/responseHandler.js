
/**
 * Sends a generic success response.
 * @param {Object} res - The Express response object.
 * @param {Object} data - The data to be sent in the success response.
 * @param {string} [message='Success'] - A custom success message.
 */
const sendSuccess = (res, data) => {
  res.status(200).json(data);
};

/**
 * Sends a generic 400 Bad Request error response.
 * @param {Object} res - The Express response object.
 * @param {string} message - The custom error message to send.
 */
const sendBadRequestError = (res, error) => {
  res.status(400).json({message : error});
};

/**
 * Sends a generic 401 Unauthorized error response.
 * @param {Object} res - The Express response object.
 * @param {string} message - The custom error message to send.
 */
const sendUnauthorizedError = (res, error = 'Paire identifiant/mot de passe incorrect') => {
  res.status(401).json({ message: error });
};

/**
 * Sends a generic 404 Not Found error response.
 * @param {Object} res - The Express response object.
 * @param {string} message - The custom error message to send.
 */
const sendNotFoundError = (res, message) => {
  res.status(404).json({ message });
};

/**
 * Sends a generic internal server error response.
 * @param {Object} res - The Express response object.
 * @param {Object} error - The error object or message to send.
 */
const sendInternalError = (res, error) => {
  console.error(error);
  res.status(500).json({ message:'Une erreur interne est survenue',error : error});
};

module.exports = {
  sendSuccess,
  sendBadRequestError,
  sendUnauthorizedError,
  sendNotFoundError,
  sendInternalError,
};
