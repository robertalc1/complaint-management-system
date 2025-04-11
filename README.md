
# Complaint Management System – Full-Stack Web App

> A production-style web application built from scratch for structured complaint tracking and management.  
> Designed with scalability, security, and real-world user flows in mind.

---

## Tech Stack

**Frontend:**  
React.js (Vite) · JavaScript · Tailwind CSS · Session Storage · PDF Export · Form Validation

**Backend:**  
Node.js · Express.js · MySQL · JWT Auth · bcrypt · REST API · Modular Routing

---

##  Features

- 🔐 JWT-based Authentication (secure login/logout)
- 📝 Complaint Management (create, edit, delete, view)
- 📁 PDF Report Export (auto-generated formatted reports)
- 🎛️ Admin Dashboard (filter, manage, control)
- 📱 Responsive UI (Tailwind CSS, mobile-ready)
- 🧩 Reusable Components (clean and scalable structure)
- 📂 Modular Backend Architecture (routes/controllers)
- ✅ Front & Backend Validation

---

## ⚡ How I Run This Project

```bash
# Frontend (React)
npm run dev
→ http://localhost:5173

# Backend (Node.js + Express)
node server.js
→ http://localhost:5000
```

# 📂 Project Structure – Complaint Management System

├── backend/
│   └── server.js                        # Express server & routing logic

├── docs/                                # Documentație și capturi de ecran
│   ├── Adauga Contestatie.png
│   ├── Adauga Membru Aditional.png
│   ├── Cautare Contestatii.png
│   ├── Dashboard.png
│   ├── Login.png
│   ├── Register.png
│   ├── Stergere Contestatie.png
│   └── Validare Adaugare Contestatie.png

├── frontend/
│   └── src/
│       ├── components/                  # Componente UI reutilizabile
│       │   ├── Footer.jsx
│       │   ├── Header.jsx
│       │   ├── Layout.jsx
│       │   └── Sidebar.jsx
│       │
│       ├── forms/                       # Formulare și funcționalități business
│       │   ├── ComplaintForm.jsx
│       │   ├── EditComplaintForm.jsx
│       │   ├── FilterComplaintFormFixed.jsx
│       │   ├── LocationPreselectionForm.jsx
│       │   └── ReportGenerator.jsx
│       │
│       ├── pages/                       # Pagini principale
│       │   ├── Dashboard.jsx
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       │
│       ├── App.jsx                      # Componenta principală
│       ├── main.jsx                     # Punctul de intrare în React
│       └── index.css                    # Stiluri globale

├── LICENSE.txt                          # Licență personalizată (privat, doar vizualizare)
└── README.md                            # Documentație principală


##  Author

**Alcaziu Robert**  
🔗 [Portfolio](https://alcaziurobert.ro) • [LinkedIn](https://linkedin.com/in/alcaziurobert) • [GitHub](https://github.com/robertalc1)


> 💬 “I build to learn. I ship to grow. And I write clean code that works.”
