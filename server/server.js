import express from 'express'
import cookieParser from 'cookie-parser'
import bp from 'body-parser'
import router from './routes/route.js'
import corsConfig from "./middleware/cors.js"
import limiter from './middleware/rateLimit.js'
import mongoose from 'mongoose'

const app = express()

app.use(corsConfig)
app.use(express.json())
app.use(bp.urlencoded({ limit: '16mb', extended: true }))
app.use(cookieParser())
app.use(limiter)
app.use(router)

const PORT = process.env.PORT || 3000;

try {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Listening ${PORT}`);
      });
    });
} catch (err) {
  console.log("Can't Connect to the server",
    err);
};