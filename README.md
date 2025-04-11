
# 🛠️ Complaint Management System – Full-Stack Web App

> A production-style web application built from scratch for structured complaint tracking and management.  
> Designed with scalability, security, and real-world user flows in mind.

---

## 🚀 Tech Stack

**Frontend:**  
React.js (Vite) · Tailwind CSS · Session Storage · PDF Export · Form Validation

**Backend:**  
Node.js · Express.js · MySQL · JWT Auth · bcrypt · REST API · Modular Routing

---

## 🎯 Features

- 🔐 JWT-based Authentication (secure login/logout)
- 📝 Complaint Management (create, edit, delete, view)
- 📁 PDF Report Export (auto-generated formatted reports)
- 🎛️ Admin Dashboard (filter, manage, control)
- 📱 Responsive UI (Tailwind CSS, mobile-ready)
- 🧩 Reusable Components (clean and scalable structure)
- 📂 Modular Backend Architecture (routes/controllers)
- ✅ Front & Backend Validation

---

## ⚡ Installation & Setup

```bash
# Frontend setup
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173

# Backend setup
cd backend
npm install
node server.js
# API runs at http://localhost:5000
```

🗂️ Create a `.env` file in `/backend/` with:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=contestatii_db
JWT_SECRET=your_jwt_secret
```

---

## 📂 Project Structure

```
root/
├── frontend/     → React + Vite App
│   └── src/
├── backend/      → Node.js + Express API
│   ├── routes/
│   ├── controllers/
│   └── server.js
├── docs/         → Features.md, screenshots, diagrams
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 💡 Why It Matters

This project simulates a real-life web app used in public institutions or enterprise contexts for complaint registration, filtering, and reporting. It proves:

- ✅ End-to-end development knowledge
- ✅ Ability to build secure, scalable apps
- ✅ Real-world understanding of authentication & data persistence
- ✅ Autonomy, clean architecture & UI/UX awareness

---

## 🔐 License

Distributed under the MIT License. See `LICENSE` for details.

---

## 🙋‍♂️ Author

**Robert Alcaziu**  
🔗 [Portfolio](https://alcaziurobert.ro) • [LinkedIn](https://linkedin.com/in/alcaziurobert) • [GitHub](https://github.com/robertalc1)

---

> 💬 “I build to learn. I ship to grow. And I write clean code that works.”
