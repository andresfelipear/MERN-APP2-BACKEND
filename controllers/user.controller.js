const jwt = require('jsonwebtoken')
const sendEmail = require('../utils/email/sendEmail')

const User = require("../models/user.model")
const Token = require("../models/token.models")
const Breakfasts = require("../models/breakfasts.models")
const Cart = require("../models/cart.model")
const { COOKIE_OPTIONS, getToken, getRefreshToken } = require('../auth/authenticate')

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { log } = require('console')
const clientURL = process.env.CLIENT_URL

//date time format
const date = require('date-and-time')
const { copyFileSync } = require('fs')

const getById = (cartId) => {
  return Cart.findById(cartId, (err, cart) => {
    if (err) console.log(err)
    return cart
  }).clone()
}


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
                { username: user.username, email: user.email, title: "Breakfasts App" },
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
    User.findOne({ $or: [{ username: username }, { email: username }] }, async (err, user) => {
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
              { username: user.username, link, title: "Breakfasts App" },
              "./template/requestResetPassword.handlebars"
            )
          res.send({ success: true })
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
        User.findOne({ _id: userId }, async (err, user) => {
          if (user) {
            await user.setPassword(password);
            await user.save()
            sendEmail
              (
                user.email,
                "Password Reset Successfully",
                { username: user.username, title: "Breakfasts App" },
                "./template/resetPassword.handlebars"
              )
            res.send({ success: true })

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

//Post contact
exports.postContact = async (req, res, next) => {
  const { name, phone, email, message } = req.body;
  const emailCustomerService = process.env.CUSTOMER_SERVICE_EMAIL
  const now = new Date()
  const dateFormat = date.format(now, "YYYY/MM/DD HH:mm:ss")

  try {
    //confirmation mail user
    sendEmail
      (
        email,
        "Contact form",
        { name: name, title: "Breakfasts App" },
        "./template/contactFormConfirm.handlebars"
      )

    //details contact form
    sendEmail
      (
        emailCustomerService,
        "Details Contact Form",
        { date: dateFormat, name: name, phone: phone, email: email, message: message, title: "Breakfasts App" },
        "./template/contactFormDetails.handlebars"
      )
    res.status(200).send({ success: true })

  } catch (err) {
    console.log(err);
    res.status(500).json({ err })
  }
}

//get Breakfasts(all)
exports.getBreakfasts = (req, res, next) => {
  try {
    Breakfasts.find((err, breakfasts) => {
      if (err) {
        res.status(400).json({ err });
      } else {
        res.send({ success: true, breakfasts })
      }
    })

  } catch (error) {
    console.log(error);
    res.status(401).json({ error })
  }

}

//get Breakfast (One)
exports.getBreakfast = (req, res, next) => {
  try {
    const { breakfastId } = req.params
    Breakfasts.findById(breakfastId, (err, breakfast) => {
      if (err) {
        res.status(500).json({ err });
      } else {
        res.send({ success: true, breakfast })
      }
    })

  } catch (error) {
    console.log(error);
    res.status(400).json({ error })
  }

}


//add item cart
exports.postAddItem = (req, res, next) => {
  try {
    const { quantity, breakfast, userId, cartId } = req.body
    const breakfastId = breakfast._id;

    Cart.find({ $or: [{ user: userId }, { _id: cartId }] }, (err, carts) => {
      console.log(userId + " " + cartId);
      if (carts.length !== 0) {     
        const cart = carts[0]
        const products = cart.products;
        const matchProduct = products.find(element => element.product.toString() === breakfastId);
        if (matchProduct) {
          matchProduct.quantity = parseInt(quantity) + parseInt(matchProduct.quantity);
          matchProduct.price = breakfast.Price * matchProduct.quantity
        } else {
          cart.products = [...cart.products,
          {
            product: breakfast._id,
            quantity: quantity,
            price: breakfast.Price * quantity
          }]
        }

        //calc total price
        const totalPrice = () => {
          let total = 0;
          for (let i = 0; i < cart.products.length; i++) {
            total += cart.products[i].price
          }
          return total
        }
        
        cart.totalPrice = totalPrice()

        // //setting user to the cartShop
        // if(carts.length===1 && cartId && userId ){
        //   cart.user = userId;
        // }

        cart.save((err, cart) => {
          if (err) {
            console.log("hola");
            console.log(err)
            res.status(500).send(err)
          } else {
            //removing products with quantity=0
            cart.products = cart.products.filter(product => product.quantity !== 0);
            cart.save((err, cart) => {
              if (err) {
                console.log("hola2");
                console.log(err)
                res.status(500).send(err)
              } else {
                res.send({ success: true, cartId: cart._id })
              }
            })

          }
        })
      } else {
        if (userId) {
          const cart = new Cart({
            products: [{
              product: breakfast._id,
              quantity: quantity,
              price: breakfast.Price * quantity,
            }],
            user: userId
          })
          cart.save((err, cart) => {
            if (err) {
              console.log("hola3");
              console.log(err)
              res.status(500).send(err)
            } else {
              res.send({ success: true, cartId: cart._id })
            }
          })
        } else {
          const cart = new Cart({
            products: [{
              product: breakfast._id,
              quantity: quantity,
              price: breakfast.Price * quantity,
            }]
          })
          cart.save((err, cart) => {
            if (err) {
              console.log(err)
              res.status(500).send(err)
            } else {
              res.send({ success: true, cartId: cart._id })
            }
          })
        }
      }
    })


  } catch (err) {
    console.log(err);
    res.status(401).json({ err })
  }
}

//get cart with breakfasts
exports.getCart = (req, res, next) => {
  try {
    const userId = req.params.userId==="undefined"?undefined:req.params.userId;
    const cartId = req.query.cartId==="undefined"?undefined:req.query.cartId;

    console.log(userId +" "+ cartId)
    if(userId || cartId){
      Cart.findOne({$or: [{user:userId}, {_id:cartId}]}).populate('products.product').exec((err, cart) => {
        if (err) {
          console.log(err)
          res.status(500).send(err)
        }
        else {
          if(cart && cartId && userId && (cart.user===undefined) ){
            cart.user = userId;
          }
          cart.save((err, cart) => {
            if (err) {
              console.log(err)
              res.status(500).send(err)
            } else {
              res.send({ success: true, cart })
            }
          })
        }
      })
    }else{
      Cart.findOne({undefined}).populate('products.product').exec((err, cart) => {
        if (err) {
          console.log(err)
          res.status(500).send(err)
        }
        else {
          res.send({ success: true, cart })
        }
      })
    }
    

  } catch (err) {
    console.log(err)
    res.status(401).json({ err })
  }
}
