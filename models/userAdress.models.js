const mongoose = require('mongoose')
const Schema = mongoose.Schema

const userAddressSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
         ref: 'User' 
    },
    fullName:{
        type:String
    },
    phoneNumber:{
        type:Number
    },
    addressField1:{
        type:String
    },
    addressField2:{
        type:String
    },
    city:{
        type:String
    },
    postalCode:{
        type:String
    }   
})

module.exports = mongoose.model('Address', userAddressSchema)