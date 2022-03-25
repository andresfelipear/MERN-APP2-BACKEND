const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email/sendEmail')

const User = require("../models/user.model")

const { COOKIE_OPTIONS, getToken, getRefreshToken } = require('../auth/authenticate')


exports.postSignUp = async (req, res, next) => {
  try {
    User.register(new User({ username: req.body.username }),
      req.body.password,
      (err, user) => {
        if (err) {
          res.status(500).send(err)
        } else {
          user.email = req.body.email
          user.icon = req.body.icon
          const token = getToken({ _id: user._id })
          const refreshToken = getRefreshToken({ _id: user._id })
          user.refreshToken.push({ refreshToken })
          user.save((err, user) => {
            if (err) {
              res.status(500).send(err)
            } else {
              res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
              const email = sendEmail(
                user.email,
                "Welcome Breakfasts App",
                { username: user.username, email: user.email, title:"Breakfasts App" },
                "./template/welcomeUser.handlebars"
              )
              res.send({ sucess: true, token })
            }
          })
        }
      }
    )
  } catch (error) {
    res.status(400).json({ error });
  }
}