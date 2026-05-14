const requireAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin role required.' });
  }
  next();
};

const requireFacultyOrAdmin = (req, res, next) => {
  const role = req.user?.role?.toLowerCase();
  if (role === 'admin' || role === 'faculty') {
      return next();
  }
  return res.status(403).json({ success: false, message: 'Faculty or Admin role required.' });
};

module.exports = { requireAdmin, requireFacultyOrAdmin };
