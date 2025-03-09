import helmet from "helmet"

export default helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://trusted-cdn.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https://trusted-images.com"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            // upgradeInsecureRequests: [], // Forces HTTPS
        },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    expectCt: { enforce: true, maxAge: 30 },
    frameguard: { action: "deny" }, // Prevents clickjacking
    hidePoweredBy: true, // Hides "X-Powered-By" header
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Enforces HTTPS for a year
    ieNoOpen: true, // Blocks downloads in IE
    noSniff: true, // Prevents MIME-type sniffing
    originAgentCluster: true, // Helps with isolation
    permittedCrossDomainPolicies: { permittedPolicies: "none" }, // Blocks Flash/PDF security issues
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }, // Limits referrer info
    xssFilter: true, // Protects against reflected XSS attacks
})