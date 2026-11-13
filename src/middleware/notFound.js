// Tanımsız rotalar için 404
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `${req.method} ${req.originalUrl} adresinde bir uç nokta yok`,
  });
};

module.exports = notFound;
