import 'dotenv/config'; // Top of the file
import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import memberRoutes from "./routes/memberRoutes.js"


dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use("/api/members", memberRoutes)

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err))

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`)
})