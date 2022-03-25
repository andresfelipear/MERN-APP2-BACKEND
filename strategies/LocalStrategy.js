const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const User = require('../models/user.model')

//called during login/signup
passport.use(new LocalStrategy(User.authenticate()))

//called while after login/signup, set user details to req.user
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());