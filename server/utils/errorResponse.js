class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Mantieni lo stack trace pulito
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorResponse;
