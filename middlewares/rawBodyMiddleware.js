const createError = require('http-errors');

exports.rawBodyMiddleware = (req, res, buf, encoding) => {
  if (req.headers['content-type'] === 'application/json') {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};
