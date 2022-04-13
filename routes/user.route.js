const { Router } = require('express')
const router = Router()
const passport = require('passport')

const userController = require('../controllers/user.controller')
const {verifyUser} = require('../auth/authenticate')

//Post Sign Up
router.post('/signup', userController.postSignUp)

//refresh Token
router.post('/refreshToken', userController.postRefreshToken)

//verify user logged
router.get('/me',verifyUser, userController.getData)

//logout user
router.get('/logout',verifyUser, userController.getLogout)

//Post Login
router.post('/login',  passport.authenticate("local"),userController.postLogin)

//Post reset Password Link
router.post('/forgot',userController.postForgot)

//Post reset password form
router.post('/resetPassword', userController.postResetPassword)

//Post contact form
router.post('/contact', userController.postContact)

//getBreakfasts
router.get('/getBreakfasts', userController.getBreakfasts)

//getBreakfast
router.get('/getBreakfast/:breakfastId', userController.getBreakfast)

//add item cart
router.post('/addItem', userController.postAddItem)

//get cart
router.get('/getCart', userController.getCart)

module.exports = router
    