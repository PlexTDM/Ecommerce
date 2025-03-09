import path from 'path'
import express from 'express'
import {
  generateAccessToken,
  generateRefreshToken,
  authenticate,
} from '../controllers/token.js'
import AuthController from '../controllers/auth.js'
import PaymentController from '../controllers/paypal.js'
import ProductsContoller from '../controllers/products.js'
import User from '../models/user.js'
import RefreshToken from '../models/refreshToken.js'
import Profile from '../models/profile.js'

const app = express.Router()
const __dirname = path.resolve()

app.get('/', (req, res) => {

  res.json({ message: 'hi nig' })
})

app.use('/auth', AuthController)
app.use('/payment', PaymentController)
app.use('/products', ProductsContoller)

app.put('/refresh-token', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken)
    return res.status(401).json({ message: 'No refresh token provided' })

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET)

    const storedToken = await RefreshToken.findOne({ userId: decoded.userId })

    if (!storedToken)
      return res.status(403).json({ message: 'Invalid refresh token' })

    const isMatch = await compare(refreshToken, storedToken.tokenHash)

    if (!isMatch)
      return res.status(403).json({ message: 'Invalid refresh token' })

    await RefreshToken.findByIdAndDelete(storedToken.id)

    // Generate new tokens
    const user = await User.findById(decoded.userId);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(403)
      .json({ message: 'Invalid or expired refresh token' });
  }
})

app.delete('/account', authenticate, async (req, res) => {
  const { id } = req.user

  try {
    await Profile.findOneAndDelete({ id })

    await RefreshToken.deleteMany({ userId: id })

    await User.findOneAndDelete({
      where: { id },
    })

    res.status(200).json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to delete account' })
  }
})

app.post('/logout', (req, res) => {
  const { id, accessToken } = req.body

  verify(accessToken, process.env.SECRET_ACCESS_TOKEN, (err, data) => {
    if (err) return res.status(401).json({ message: err })

    prisma.accessTokens.delete({
      token: accessToken,
    })
    res.json({ message: 'Logged out' })
  })
})

export default app;
