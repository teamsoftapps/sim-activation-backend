/** @format */

// utils/authUser.js
const authUser = (req) => {
  // Best case: we attached role in middleware (from JWT)
  if (req.auth?.role) {
    return {
      user: req.auth.entity,
      type: req.auth.role, // 'admin' or 'user'
      isAdmin: req.auth.role === 'admin',
      isUser: req.auth.role === 'user',
    };
  }

  // Fallback: detect by model fields (in case middleware didn't set req.auth)
  if (req.admin || (req.user && typeof req.user.credits === 'undefined')) {
    return {
      user: req.admin || req.user,
      type: 'admin',
      isAdmin: true,
      isUser: false,
    };
  }

  if (req.user && typeof req.user.credits === 'number') {
    return {
      user: req.user,
      type: 'user',
      isAdmin: false,
      isUser: true,
    };
  }

  return { user: null, type: null, isAdmin: false, isUser: false };
};

export default authUser;
