const mongoose = require('mongoose')
const Schema = mongoose.Schema

const cartSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
         ref: 'User' 
    },
    products:[{
        product: { 
            type: Schema.Types.ObjectId,
            ref: 'Breakfasts',
            unique:false
        },
        quantity:{
            type: Number,
            defaul:0
        },
        price:{
            type: Number,
            default: 0
        }
    }],
    totalPrice:{
        type: Number,
        default:  function(){
            let total=0;
            for(let i=0;i<this.products.length;i++){
                total+= this.products[i].price
            }
            return total
        }
    }
    
})

module.exports = mongoose.model('Cart', cartSchema)