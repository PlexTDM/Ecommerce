import cors from 'cors'


const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS || '';
const allowedOriginsArray = allowedOrigins.split(',').map(item => item.trim());

const corsConfig = cors({
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    maxAge: 600,
    credentials: true,
    origin: (origin, callback) => {
        if (allowedOriginsArray.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(`${origin} is not allowed by CORS`);
        }
    },
});

export default corsConfig;