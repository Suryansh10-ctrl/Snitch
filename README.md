# 🛍️ Snitch

**Snitch** is a modern full-stack **MERN eCommerce application** that delivers a seamless online shopping experience. It features secure authentication, product management, shopping cart, wishlist, order processing, payment integration, and an intuitive admin dashboard.

---

## 🚀 Features

### 👤 User Features
- 🔐 JWT Authentication
- 🔑 Google OAuth Login
- 👤 User Profile Management
- 🛒 Shopping Cart
- ❤️ Wishlist
- 📦 Order Placement
- 📜 Order History
- 💳 Secure Payment Integration
- 🔍 Product Search & Filtering
- 📱 Fully Responsive UI

### 🛍️ Product Features
- Product Categories
- Product Variants (Size, Color, etc.)
- Product Images
- Product Reviews & Ratings
- Inventory Management
- Related Products

### 🛠️ Admin Features
- Admin Dashboard
- Product CRUD Operations
- Category Management
- Order Management
- User Management
- Sales Analytics
- Inventory Control

---

# 🏗️ Tech Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Redux Toolkit
- React Hot Toast

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Passport.js (Google OAuth)
- Multer

## Database

- MongoDB Atlas

## Payment

- Razorpay - Test Mode
## Deployment

- Frontend: https://snitch-b1zz.onrender.com/
- Backend: https://snitch-b1zz.onrender.com/
- Database: MongoDB Atlas

---

# 📂 Folder Structure

```
Snitch/
│
├── Frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   └── package.json
│
└── README.md
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/snitch.git
```

```bash
cd snitch
```

---

## Backend Setup

```bash
cd Backend
```

Install dependencies

```bash
npm install
```

Create `.env`

```env
PORT=3000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_secret

CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

Run backend

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd Frontend
```

Install dependencies

```bash
npm install
```

Create `.env`

```env
VITE_API_URL=http://localhost:3000/api
VITE_RAZORPAY_KEY=your_key
```

Run frontend

```bash
npm run dev
```

---

# 📸 Screenshots

<img width="1917" height="922" alt="image" src="https://github.com/user-attachments/assets/8f746e13-b933-4d59-a730-38f77889a233" />

<img width="1916" height="922" alt="Screenshot 2026-08-01 235058" src="https://github.com/user-attachments/assets/97cdc6c7-e2e2-4fa4-b0b4-bb1b890e6369" />

<img width="1917" height="920" alt="image" src="https://github.com/user-attachments/assets/e18ae90b-8064-4995-af9a-e8204c3eaebf" />


---

# 🔒 Authentication

- JWT Authentication
- Google OAuth
- Protected Routes
- Role-Based Authorization (Admin/User)

---

# 💳 Payment Flow

- Add Products to Cart
- Checkout
- Razorpay Payment Gateway
- Verify Payment
- Create Order
- Order Confirmation

---

# 📦 API Highlights

### Authentication

```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/get-me
```

### Products

```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id
```

### Cart

```
GET    /api/cart
POST   /api/cart
PATCH  /api/cart/:id
DELETE /api/cart/:id
```

### Orders

```
POST /api/orders
GET  /api/orders
```

---

# 🌟 Future Improvements

- Product Reviews
- Invoice Generation
- Multi-language Support
- PWA Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/AmazingFeature
```

3. Commit your changes

```bash
git commit -m "Add AmazingFeature"
```

4. Push

```bash
git push origin feature/AmazingFeature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Suryansh Sharma**

- GitHub: https://github.com/Suryansh10-ctrl
- LinkedIn: *(Add your LinkedIn URL)*

---

## ⭐ Support

If you found this project helpful, consider giving it a ⭐ on GitHub!
