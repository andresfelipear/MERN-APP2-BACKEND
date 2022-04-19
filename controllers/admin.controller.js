const Breakfasts = require("../models/breakfasts.models")
const Address = require("../models/userAdress.model")
const User = require("../models/user.model")
const Cart = require("../models/cart.model")
const sendEmail = require('../utils/email/sendEmail')

const getById = (breakfastId) => {
    return Breakfasts.findById(breakfastId, (err, breakfast) => {
        if (err) console.log(err)
        return breakfast
    }).clone()
}

//Like Post
exports.postLikeBreakfast = async (req, res, next) => {
    try {
        const { breakfastId } = req.body
        const breakfast = await getById(breakfastId)

        breakfast.likes = breakfast.likes + 1
        await breakfast.save()
        res.send({ success: true })

    } catch (error) {
        console.log(error)
        res.status(400).json({ error })
    }

}

//save user address
exports.postUserAddress = async (req, res, next) => {
    const { fullname, phoneNumber, addressF1, addressF2, city, postalCode } = req.body
    const userId = req.user._id
    try {
        const address = new Address({
            user: req.user._id,
            fullName: fullname,
            phoneNumber: phoneNumber,
            addressField1: addressF1,
            addressField2: addressF2,
            city: city,
            postalCode: postalCode
        })
        address.save(async (err, address) => {
            if (err) {
                console.log(err)
                res.status(500).send(err)
            } else {
                const user = await User.findById(userId)
                user.address = address._id;
                user.save((err, user) => {
                    if (err) {
                        console.log(err)
                        res.status(500).send(err)
                    } else {
                        res.send({ success: true, address: address })
                    }
                })
            }
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ err })
    }

}

//process order
exports.postProcessOrder = async (req, res, next) => {
    const { token, cart, price } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId).populate("address");
    user.order.push({
        cart: cart,
        grandTotal: price,
        token: token
    })
    user.save((err, user) => {
        if (err) {
            console.log(err)
            res.status(500).send(err)
        } else {
            if (err) {
                console.log(err)
                res.status(500).send(err)
            } else {
                const orderId = user.order[user.order.length - 1]._id
                const email = sendEmail(
                    user.email,
                    "Order Confirmation",
                    { username: user.username, city: user.address.city, address: `${user.address.addressField1}, ${user.address.addressField2}`, orderId: orderId, total: price.toFixed(2), token: token, title: "Breakfasts App" },
                    "./template/confirmationOrder.handlebars"
                )
                Cart.findByIdAndDelete(cart._id, (err, response) => {
                    if (err) {
                        console.log(err)
                        res.status(500).send(err)
                    } else {
                        res.send({ success: true })
                    }
                })

            }

        }
    })

}