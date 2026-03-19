import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import RefreshToken from '../models/refreshToken.js'

export const generateAccessToken = user => {
    return jwt.sign({ id: user.id, role: user.role }, Bun.env.SECRET_ACCESS_TOKEN, {
        expiresIn: '1d'
    })
}

export const generateRefreshToken = async user => {
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, Bun.env.SECRET_REFRESH_TOKEN, { expiresIn: "7d" });
    const hashedToken = await bcryptjs.hash(refreshToken, 10);

    await RefreshToken.create({
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        userId: user.id,
    })

    return refreshToken
}

export const authenticate = async (c, next) => {
    const token = c.req.header("Authorization")?.replace("Bearer ", "");

    if (!token) return c.json({ message: "No token provided" }, 401);

    try {
        const decoded = jwt.verify(token, Bun.env.SECRET_ACCESS_TOKEN);
        c.set('user', decoded)
        await next()
    } catch (error) {
        console.error('auth middleware', error);
        return c.json({ message: "Invalid or expired token" }, 401);
    }
}

export const authorizeRole = role => {
    return async (c, next) => {
        const user = c.get('user')
        if (!user || user.role !== role) return c.json({ error: "Forbidden" }, 403);
        await next();
    };
}
