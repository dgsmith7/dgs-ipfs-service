import passport from "passport";

const auth = passport.authenticate("jwt", { session: false });

// Check if the user's role is allowed
const authorize = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ msg: "Forbidden" });
  }
  next();
};

const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
};

// Clear authentication cookie and render logout page
const signOut = (req, res) => {
  res.clearCookie("token");
  res.render("logout.ejs");
};

export { auth, authorize, isAuthenticated, signOut };
