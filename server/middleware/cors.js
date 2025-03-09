import cors from 'cors'

const allowedOrigins = [
    "http://192.168.1.57",
    "http://192.168.1.57:5173",
    "http://192.168.1.176",
    "http://localhost:8888",
    "http://192.168.88.127",
];

const corsConfig = cors({
    allowMethods: ["GET", "POST", "PUT", "DELETE"],
    maxAge: 600,
    credentials: true,
    origin: allowedOrigins,
});

export default corsConfig;