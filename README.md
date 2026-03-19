<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Bun-Runtime-FBF0DF?style=for-the-badge&logo=bun&logoColor=black" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

# 🛒 Ecommerce

A full-stack ecommerce platform built with **React 19** and **Express**, featuring product browsing, cart management, user authentication, PayPal checkout, and a product data scraper. Styled with **Tailwind CSS v4** and **MUI**, powered by **MongoDB** and **Redis** caching.

---

## ✨ Features

| Area                | Details                                                            |
| ------------------- | ------------------------------------------------------------------ |
| 🏠 **Home**         | Hero carousel, featured products, promo banners, newsletter signup |
| 🔍 **Products**     | Paginated catalog, search with filters, skeleton loading states    |
| 📦 **Product Page** | Image gallery with zoom, descriptions, ratings, tags               |
| 🛒 **Cart**         | Add/remove items, quantity control via Redux                       |
| 💳 **Checkout**     | Full checkout flow with PayPal integration                         |
| 🔐 **Auth**         | Register, login, JWT access + refresh tokens, account deletion     |
| 👤 **Profile**      | User profile management                                            |
| 🚀 **Performance**  | Redis server-side caching, localStorage client-side caching        |
| 🛡️ **Security**     | Helmet CSP, CORS whitelist, rate limiting, bcrypt passwords        |
| 🕷️ **Scraper**      | Puppeteer-based product scraper with parallel page processing      |

---

## 🏗️ Tech Stack

### Frontend

- **React 19** — UI framework
- **Vite** — Build tool & dev server
- **Tailwind CSS v4** — Utility-first styling
- **MUI (Material UI)** — Component library
- **Redux Toolkit** — State management (cart)
- **React Router v7** — Client-side routing
- **Motion** — Animations
- **Swiper** — Image carousels
- **Axios** — HTTP client
- **react-hot-toast** — Toast notifications
- **react-loading-skeleton** — Skeleton loaders

### Backend

- **Express 4** — REST API server
- **Mongoose** — MongoDB ODM
- **Redis** — Server-side caching layer
- **JWT** — Access & refresh token authentication
- **bcryptjs** — Password hashing
- **Puppeteer** — Web scraper engine
- **Helmet** — Security headers
- **express-rate-limit** — Request rate limiting
- **express-validator** — Input validation

### Runtime

- **Bun** — Package manager & runtime

---

## 📁 Project Structure

```
Ecommerce/
├── public/                     # Static assets
├── src/                        # React frontend
│   ├── components/
│   │   ├── Carousel.jsx        # Hero carousel (Swiper)
│   │   ├── Navbar.jsx          # Navigation bar
│   │   ├── Footer.jsx          # Site footer
│   │   ├── ProductCard.jsx     # Product card component
│   │   ├── ProductLoading.jsx  # Skeleton loader
│   │   ├── Pagination.jsx      # Page navigation
│   │   ├── Search.jsx          # Search bar
│   │   ├── SideSearchBar.jsx   # Sidebar filters
│   │   └── ScrollToTop.jsx     # Scroll restoration
│   ├── context/
│   │   └── ProductsContext.jsx # Products context provider
│   ├── helper/
│   │   └── functions.js        # Utility functions
│   ├── pages/
│   │   ├── HomePage.jsx        # Landing page
│   │   ├── Products.jsx        # Product catalog
│   │   ├── ProductSinglePage.jsx # Product detail
│   │   ├── Cart.jsx            # Shopping cart
│   │   ├── Checkout.jsx        # Checkout flow
│   │   ├── Login.jsx           # Login page
│   │   ├── Register.jsx        # Registration page
│   │   ├── Profile.jsx         # User profile
│   │   ├── AboutPage.jsx       # About page
│   │   ├── ContactPage.jsx     # Contact page
│   │   └── PageNotFound.jsx    # 404 page
│   ├── redux/
│   │   ├── action/             # Redux actions
│   │   ├── reducer/            # Redux reducers
│   │   └── store.js            # Redux store config
│   ├── App.jsx                 # Root component & routes
│   ├── main.jsx                # Entry point
│   └── index.css               # Global styles
│
├── server/                     # Express backend
│   ├── controllers/
│   │   ├── auth.js             # Auth (register/login)
│   │   ├── products.js         # Product CRUD & search
│   │   ├── paypal.js           # PayPal payment handling
│   │   ├── scraper.js          # Puppeteer product scraper
│   │   └── token.js            # JWT token generation
│   ├── middleware/
│   │   ├── cache.js            # Redis client setup
│   │   ├── cors.js             # CORS configuration
│   │   ├── helmet.js           # Security headers (CSP)
│   │   ├── rateLimit.js        # Rate limiter
│   │   └── middleware.js       # Middleware barrel
│   ├── models/
│   │   ├── product.js          # Product schema
│   │   ├── user.js             # User schema
│   │   ├── profile.js          # Profile schema
│   │   └── refreshToken.js     # Refresh token schema
│   ├── routes/
│   │   └── route.js            # API route definitions
│   ├── server.js               # Server entry point
│   ├── .env.example            # Environment template
│   └── package.json            # Backend dependencies
│
├── .env                        # Frontend env variables
├── package.json                # Frontend dependencies
├── vite.config.js              # Vite configuration
└── index.html                  # HTML entry point
```

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (v1.0+)
- [MongoDB](https://www.mongodb.com/) instance
- [Redis](https://redis.io/) instance
- [PayPal Developer](https://developer.paypal.com/) credentials (for checkout)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Ecommerce.git
cd Ecommerce
```

### 2. Install dependencies

```bash
# Frontend
bun install

# Backend
cd server
bun install
```

### 3. Configure environment variables

**Frontend** (`.env` in root):

```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PORT=8888
SECRET_ACCESS_TOKEN=your_access_token_secret
SECRET_REFRESH_TOKEN=your_refresh_token_secret
VITE_BACK_END_API=http://localhost:8888
```

**Backend** (`server/.env`):

```env
REDIS_PASSWORD=your_redis_password
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
MONGO_URI=your_mongodb_connection_string
CORS_ALLOWED_ORIGINS=http://localhost:5173, http://localhost:3000
```

### 4. Run the application

```bash
# Terminal 1 — Frontend (Vite dev server)
bun dev

# Terminal 2 — Backend (Express server)
bun i -g nodemon
cd server
bun start
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8888`.

---

## 📡 API Routes

| Method   | Endpoint                 | Description                    |
| -------- | ------------------------ | ------------------------------ |
| `GET`    | `/`                      | Health check                   |
| `POST`   | `/auth/register`         | Register new user              |
| `POST`   | `/auth/login`            | Login user                     |
| `PUT`    | `/refresh-token`         | Refresh JWT tokens             |
| `POST`   | `/logout`                | Logout user                    |
| `DELETE` | `/account`               | Delete account (authenticated) |
| `GET`    | `/products/:page`        | Get paginated products         |
| `GET`    | `/products/search`       | Search products                |
| `GET`    | `/products/product/:id`  | Get single product             |
| `POST`   | `/payment/create-order`  | Create PayPal order            |
| `POST`   | `/payment/capture-order` | Capture PayPal payment         |

---

## 📝 To-Do

### High Priority

- [ ] Convert back-end code to TS
- [ ] Integrate Bun
- [ ] Add product categories and category filtering
- [ ] Implement order history page for users
- [ ] Add input validation on frontend forms (login, register, checkout)
- [ ] Handle Redis connection failure gracefully (fallback without cache)
- [] Make about us(or replace) and 404 pages

### Features

- [ ] Wishlist / favorites functionality
- [ ] Admin dashboard for product management
- [ ] Email verification on registration
- [ ] Password reset flow
- [ ] Inventory / stock management
- [ ] Order tracking and status updates
- [ ] Multi-image upload for products

### Performance & Caching

- [ ] Add image optimization and lazy loading
- [ ] Implement infinite scroll as alternative to pagination

### Security

- [ ] Add CSRF protection
- [ ] Implement input sanitization on all API endpoints
- [ ] Add request logging and monitoring

### DevOps

- [x] Add Docker and docker-compose setup
- [ ] Set up CI/CD pipeline
- [ ] Add unit and integration tests
- [ ] Configure production build and deployment
- [ ] Add API documentation (Swagger/OpenAPI)

### UI/UX

- [ ] Complete "Shop by Category" section on homepage
- [ ] Add dark mode toggle
- [ ] Improve mobile responsive design
- [ ] Add breadcrumb navigation
- [ ] Implement toast notifications for all user actions
- [ ] Add empty state designs (empty cart, no search results)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Built by <a href="https://github.com/PlexTDM">unnamed</a>
</p>
