/**
 * Role-Based Access Control (RBAC) Middleware.
 * Must be used AFTER requireAuth middleware.
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Unauthorized: User role not found' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role` });
    }

    next();
  };
};

// Convenience helpers
const requireAdmin = requireRole(['admin']);
const requireManager = requireRole(['admin', 'manager']); // Managers and Admins
const requireEmployee = requireRole(['admin', 'manager', 'employee']); // Everyone

module.exports = {
  requireRole,
  requireAdmin,
  requireManager,
  requireEmployee,
};
