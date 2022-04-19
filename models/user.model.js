const passportLocalMongoose = require('passport-local-mongoose')
const { Schema, model } = require("../db/connection")

const Session = new Schema({
    refreshToken: {
        type: String,
        default: ''
    }
})

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true },
    icon: { type: String },
    password: { type: String },
    authStrategy: {
        type: String,
        default: 'local'
    },
    refreshToken: {
        type: [Session]
    },
    address: {
        type: Schema.Types.ObjectId,
        ref: 'Address',

    },
    order:[{
        cart: { 
            type: Schema.Types.ObjectId,
            ref: 'Cart',

        },
        token:{
            type:Object
        }
    }]
})



//remove refreshtoken from the response
UserSchema.set("toJSON", {
    transform: function (doc, ret, options) {
        delete ret.refreshToken
        return ret
    }
})

UserSchema.plugin(passportLocalMongoose)

const User = model("User", UserSchema)

module.exports = User