const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email/sendEmail')

const User = require("../models/user.model")
const Token = require("../models/token.models")

const { COOKIE_OPTIONS, getToken, getRefreshToken } = require('../auth/authenticate')

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { log } = require('console')
const clientURL = process.env.CLIENT_URL

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

//refreshToken
exports.postRefreshToken = (req, res, next) => {
  const { signedCookies = {} } = req
  const { refreshToken } = signedCookies
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
      const userId = payload._id
      User.findOne({ _id: userId }).then(user => {
        if (user) {
          const tokenIndex = user.refreshToken.findIndex(item => item.refreshToken == refreshToken)

          if (tokenIndex === -1) {
            res.status(401).send("Unauthorized")
          } else {
            const token = getToken({ _id: userId })
            const newRefreshToken = getRefreshToken({ _id: userId })
            user.refreshToken[tokenIndex] = { refreshToken: newRefreshToken }
            user.save((err, user) => {
              if (err) {
                res.status(500).send(err)
              } else {
                res.cookie("refreshToken", newRefreshToken, COOKIE_OPTIONS)
                res.send({ success: true, token })
              }
            })
          }
        }
      })
    } catch (err) {
      console.log(err)
      res.status(401).send("Unauthorized")
    }
  } else {
    (err) => {
      console.log(err)
    }
    res.status(401).send("Unauthorized")
  }
}

//getData user logged
exports.getData = (req, res, next) => {
  try {
    res.send(req.user)

  } catch (error) {
    console.log(err)
    res.status(401).json({ error })
  }

}

//logout user
exports.getLogout = (req, res, next) => {
  try {

    const { signedCookies = {} } = req
    const { refreshToken } = signedCookies;

    User.findById(req.user._id)
      .then((user) => {
        const tokenIndex = user.refreshToken.findIndex(item => item.refreshToken == refreshToken)
        if (tokenIndex !== -1) {
          user.refreshToken.id(user.refreshToken[tokenIndex]._id).remove()
        }
        user.save((err, user) => {
          if (err) {
            res.status(500).send(err)
          } else {
            res.clearCookie('refreshToken', COOKIE_OPTIONS)
            res.send({ success: true })
          }

        })
      })
  }
  catch (error) {
    console.log(error);
    res.status(401).json({ error })
  }

}

//login
exports.postLogin = (req, res, next) => {
  try {
    const token = getToken({ _id: req.user._id })
    const refreshToken = getRefreshToken({ _id: req.user._id })

    const { username, password } = req.body
    User.findOne({ username: username }, (err, user) => {
      if (user) {
        user.refreshToken.push({ refreshToken })
        user.save((err, user) => {
          if (err) {
            res.status(500).send(err)
          } else {
            res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS)
            res.send({ success: true, token })
          }
        })
      }
      else {
        res.status(400).json({ err });
      }
    })
  } catch (error) {
    console.log(error)
    res.status(400).json({ error });
  }
}


//forgot link
exports.postForgot = (req, res, next) => {
  const bcryptSalt = 10;
  try {
    const { username } = req.body
    User.findOne({$or:[{username:username}, {email:username}]}, async (err, user) => {
      if (user) {
        const token = await Token.findOne({ userId: user._id })
        if (token) await token.deleteOne()
        const resetToken = crypto.randomBytes(32).toString("hex")
        try {
          const hash = await bcrypt.hash(resetToken, bcryptSalt)
          await new Token({
            userId: user._id,
            token: hash,
            createdAt: Date.now()
          }).save()
          const link = `${clientURL}/resetPassword?token=${resetToken}&id=${user._id}`
          sendEmail
            (
              user.email,
              "Password Reset Request",
              { username: user.username, link, title:"Breakfasts App"},
              "./template/requestResetPassword.handlebars"
            )
          res.send({ sucess: true })
        } catch (error) {
          res.status(400).json({ error });
        }
      }
      else {
        res.status(400).json({ err });
      }
    })
  } catch (error) {
    res.status(400).json({ error });
  }
}

//post resetPassword 
exports.postResetPassword = async (req, res, next) => {
  const { password, userId, token } = req.body;
  Token.findOne({ userId: userId }, async (error, resetToken) => {
    if (resetToken) {
      const isValid = await bcrypt.compare(token, resetToken.token)
      if (!isValid) {
        res.status(400).json({ err });
      } else {
        User.findOne({ _id:userId }, async (err, user) => {
          if (user) {
            await user.setPassword(password);
            await user.save()
            sendEmail
              (
                user.email,
                "Password Reset Successfully",
                { username: user.username, title:"Breakfasts App" },
                "./template/resetPassword.handlebars"
              )
            res.send({ sucess: true })

          } else {
            res.status(400).json({ err });
          }

        })


      }
    } else {
      res.status(400).json({ error });
    }
  })



}