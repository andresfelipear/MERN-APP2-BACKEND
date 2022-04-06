const mongoose = require('mongoose')
const Schema = mongoose.Schema

const breakfastsSchema = new Schema({
    Name: {
        type: String,
        required: true,
    },
    Price: {
        type: Number,
        required: true
    },
    Img: {
        type: String,
        required: true,
    },
    Items:[{
        item:{
            type: String
        }
    }]
})

module.exports = mongoose.model('Token', tokenSchema)