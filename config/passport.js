import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/UserModel.js";
import dotenv from "dotenv";

dotenv.config();

const configurePassport = () => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (req) => (req && req.cookies ? req.cookies.token : null),
      ExtractJwt.fromAuthHeaderAsBearerToken(),
    ]),
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id);
        return user ? done(null, user) : done(null, false);
      } catch (err) {
        return done(err, false);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (err) {
      done(err, null);
    }
  });
};

export default configurePassport;
