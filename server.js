require("dotenv").config()
const express = require("express") 
const morgan = require("morgan") 
const {log} = require("mercedlogger") 
const cors = require("cors") 
const userRoute = require("./routes/user.route") 
const adminRoute = require("./routes/admin.route")
const cookieParser = require('cookie-parser')
const passport = require('passport')

require('./strategies/JwtStrategy')
require('./strategies/LocalStrategy')
require('./auth/authenticate')

const app = express()

app.use(cookieParser(process.env.COOKIE_SECRET))
const whitelist = process.env.WHITELIST_DOMAINS ? process.env.WHITELIST_DOMAINS.split(',') : []
const corsOption = {
    origin: (origin, callback) => {
        if(!origin || whitelist.indexOf(origin) !== -1){
            callback(null, true)
        }else{
            callback(null, true)
        }
    },
    credentials: true
}

app.use(cors(corsOption)) 
app.use(passport.initialize())
app.use(morgan("tiny"))
app.use(express.json()) 


app.get("/", (req, res) => {
    res.send("this is the test route to make sure server is working")
})
app.use("/api/user", userRoute) 
// app.use("/api/admin", adminRoute) 

const {PORT = 8000} = process.env
app.listen(PORT, () => log.green("SERVER STATUS", `Listening on port ${PORT}`))