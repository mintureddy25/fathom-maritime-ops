class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const ok = (res, data) => res.json(data);
const created = (res, data) => res.status(201).json(data);

module.exports = { HttpError, ok, created };
