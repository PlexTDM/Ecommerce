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
import { Hono } from 'hono'
import jwt from 'jsonwebtoken'
import { compare } from 'bcryptjs'

const app = new Hono()


app.get('/', (c) => {

  return c.json({ message: 'hi nig' })
})

app.route('/auth', AuthController)
app.route('/payment', PaymentController)
app.route('/products', ProductsContoller)

app.put('/refresh-token', async (c) => {
  const { refreshToken } = await c.req.parseBody()
  if (!refreshToken)
    return c.json({ message: 'No refresh token provided' }, 401)

  try {
    const decoded = jwt.verify(refreshToken, Bun.env.SECRET_REFRESH_TOKEN)

    const storedToken = await RefreshToken.findOne({ userId: decoded.userId })

    if (!storedToken)
      return c.json({ message: 'Invalid refresh token' }, 403)

    const isMatch = await compare(refreshToken, storedToken.tokenHash)

    if (!isMatch)
      return c.json({ message: 'Invalid refresh token' }, 403)

    await RefreshToken.findByIdAndDelete(storedToken.id)

    // Generate new tokens
    const user = await User.findById(decoded.userId);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return c.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error(error);
    return c.json({ message: 'Invalid or expired refresh token' }, 403);
  }
})

app.delete('/account', authenticate, async (c) => {
  const { id } = c.get('user')

  try {
    await Profile.findOneAndDelete({ id })

    await RefreshToken.deleteMany({ userId: id })

    await User.findOneAndDelete({ id })

    return c.json({ message: 'Account deleted successfully' }, 200)
  } catch (error) {
    console.error(error)
    return c.json({ message: 'Failed to delete account' }, 500)
  }
})

app.post('/logout', async (c) => {
  const body = await c.req.json().catch(() => c.req.parseBody())
  const { id, accessToken } = body

  try {
    jwt.verify(accessToken, Bun.env.SECRET_ACCESS_TOKEN)
    // implement logout logic
    return c.json({ message: 'Logged out' }, 200)
  } catch (err) {
    return c.json({ message: 'Invalid token' }, 401)
  }
})

export default app;
