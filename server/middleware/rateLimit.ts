import { rateLimiter } from "hono-rate-limiter";

const limiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per windowMs
    message: { error: "Too many requests, please try again later." },
    keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "",
    standardHeaders: true,
})

export default limiter