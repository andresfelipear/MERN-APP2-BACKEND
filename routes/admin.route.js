const { Router } = require('express')
const router = Router()

const adminController = require('../controllers/admin.controller')
const {verifyUser} = require('../auth/authenticate')

//like breakfast
router.post('/like-breakfast',verifyUser, adminController.postLikeBreakfast)

module.exports = router
    