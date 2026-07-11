const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Sunucu hatası';

  res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
