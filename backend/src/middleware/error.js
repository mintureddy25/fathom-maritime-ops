const { HttpError } = require('../utils/http');

function notFound(_req, _res, next) {
  next(new HttpError(404, 'Not found'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({ error: err.message, details: err.errors?.map(e => e.message) });
  }
  console.error('[unhandled]', err);
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { notFound, errorHandler };
