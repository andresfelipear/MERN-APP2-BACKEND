const Breakfasts = require("../models/breakfasts.models")
const Address = require("../models/userAdress.model")

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
    const {fullname,phoneNumber,addressF1,addressF2,city,postalCode} = req.body
    try {
        console.log(req.user);
        const address = new Address({
            user:req.user._id,
            fullName:fullname,
            phoneNumber:phoneNumber,
            addressField1:addressF1,
            addressField2:addressF2,
            city:city,
            postalCode:postalCode
        })
        address.save((address,err)=>{
            if (err) {
                console.log(err)
                res.status(500).send(err)
              } else {
                req.user.address = address._id
                req.user.save((err, user)=>{
                    if(err){
                        console.log(err)
                        res.status(500).send(err)
                    }else{
                        res.send({ success: true, address: address})
                    }
                })
              }
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ err })
    }

}
