const { Router } = require('express')
const router = Router()

const adminController = require('../controllers/admin.controller')
const {verifyUser} = require('../auth/authenticate')

//like breakfast
router.post('/like-breakfast',verifyUser, adminController.postLikeBreakfast)

//save user address
router.post('/userAddress',verifyUser, adminController.postUserAddress)

//send order
router.post('/process-order',verifyUser, adminController.postProcessOrder)

module.exports = router
    