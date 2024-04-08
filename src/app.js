import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser" 
const app = express() //making an app

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:  true
}))
app.use(express.json({limit:"16kb"})) //preping data for json
app.use(express.urlencoded({extended:true, limit:"16kb"}))//for url encoded data
app.use(express.static("public"))
app.use(cookieParser())
export { app }