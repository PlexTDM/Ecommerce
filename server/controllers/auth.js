import { generateAccessToken, generateRefreshToken } from './token.js'
import bcryptjs from 'bcryptjs'
import User from '../models/user.js'
import Profile from '../models/profile.js'
import mongoose from 'mongoose'
import { Hono } from 'hono'
import { validator } from 'hono/validator'

const app = new Hono()
const { genSaltSync, hashSync, compareSync } = bcryptjs

app.get('/ping', (c) => c.text('pong'))

app.post('/login', async (c) => {
    const body = await c.req.json().catch(() => c.req.parseBody())
    const { password, email } = body
    try {
        const user = await User.findOne({ email: email })

        if (!user) {
            return c.json({ message: "user not found" }, 404)
        }
        if (!bcryptjs.compareSync(password, user.password)) {
            return c.json({ message: 'password does not match' }, 401)
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);

        return c.json({
            message: "User Logged in successfully",
            user,
            accessToken,
            refreshToken,
        });
    } catch (e) {
        console.error('login', e)
        return c.json({ message: "Internal Server Error" }, 500)
    }
})

const validateUser = (value, c) => {
    if (!value.email.includes('@')) {
        return c.json({ message: "Invalid email" }, 400)
    }
    if (value.password.length < 6) {
        return c.json({ message: "Password must be at least 6 characters long" }, 400)
    }
}

app.post('/register', validator('json', validateUser), async (c) => {
    const body = await c.req.json().catch(() => c.req.parseBody())
    const { name, email, password, confirmPassword } = body

    if (password !== confirmPassword) {
        return c.json({ message: "Passwords do not match" }, 400)
    }

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        const existingUser = await User.findOne({ email }).session(session)

        if (existingUser) {
            console.log('trying to register existing user', existingUser.email)
            await session.abortTransaction()
            session.endSession()
            return c.json({ message: "User already exists" }, 400)
        }

        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)

        const newUser = await User.create([{
            email,
            password: hashedPassword,
        }], { session })

        const newUserProfile = await Profile.create([{
            bio: "Hello I Like Anime",
            userId: newUser[0]._id
        }], { session })


        console.log('user registered', newUser[0])
        const accessToken = generateAccessToken(newUser[0])
        const refreshToken = await generateRefreshToken(newUser[0])

        await session.commitTransaction()
        session.endSession()

        return c.json({
            message: "User registered successfully",
            user: { id: newUser[0].id, email: newUser[0].email, role: newUser[0].role },
            accessToken,
            refreshToken,
        }, 201)

    } catch (e) {
        if (e) {
            await session.abortTransaction()
            session.endSession()
            console.error('register', e)
            return c.json({ message: "Internal Server Error" }, 500)
        }
    }
})

app.put('/update', async (c) => {
    const body = await c.req.json().catch(() => c.req.parseBody())
    const { password, newPassword, accessToken, id } = body
    try {
        const user = await User.findById(id)

        if (!user) {
            return c.json({ message: 'user not found' }, 404)
        }

        const valid = compareSync(password, user.password)
        if (!valid) return c.json({ message: "password didn't match" }, 401);

        const salt = genSaltSync(18)
        const hashedPassword = hashSync(newPassword, salt)

        await User.findByIdAndUpdate(id, {
            password: hashedPassword
        })

        return c.json({ message: "Password updated successfully" }, 200)
    } catch (e) {
        console.error('update', e)
        return c.json({ message: "Internal Server Error" }, 500)
    }
})

export default app