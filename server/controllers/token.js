import jwt from 'jsonwebtoken'
import { config } from 'dotenv'
import bcryptjs from 'bcryptjs'
import RefreshToken from '../models/refreshToken.js'

config()

export const generateAccessToken = user => {
    return jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_ACCESS_TOKEN, {
        expiresIn: '1d'
    })
}

export const generateRefreshToken = async user => {
    const refreshToken = jwt.sign({ id: user.id, role: user.role }, process.env.SECRET_REFRESH_TOKEN, { expiresIn: "7d" });
    const hashedToken = await bcryptjs.hash(refreshToken, 10);

    await RefreshToken.create({
        tokenHash: hashedToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
        userId: user.id,
    })

    return refreshToken
}

export const authenticate = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) return res.status(401).json({ message: "No token provided" });

    try {
        const decoded = jwt.verify(token, process.env.SECRET_ACCESS_TOKEN);
        req.user = decoded
        next()
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Invalid or expired token" });
    }
}

export const authorizeRole = role => {
    return (req, res, next) => {
        if (req.user.role !== role) return res.status(403).json({ error: "Forbidden" });
        next();
    };
}
