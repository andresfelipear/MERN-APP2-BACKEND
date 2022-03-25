const { Router } = require('express')
const router = Router()
const passport = require('passport')

const userController = require('../controllers/user.controller')
const {verifyUser} = require('../auth/authenticate')

//Post Sign Up
router.post('/signup', userController.postSignUp)

//refresh Token
router.post('/refreshToken', userController.postRefreshToken)


module.exports = router
    