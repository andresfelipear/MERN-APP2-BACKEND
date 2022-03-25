const passport = require('passport')
const {Strategy: JwtStrategy, ExtractJwt} = require('passport-jwt')
const User = require('../models/user.model')

const options = {}
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
options.secretOrKey = process.env.JWT_SECRET

passport.use(new JwtStrategy(options, function(payload, done){
    User.findOne({ _id: payload._id }, function(err, user){
        if(err) return done(err, false)

        if(user){
            return done(null, user)
        }else{
            return done(null, false)
        }
    })
}))
