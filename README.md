# 🛡️ Audit Monitoring System (AMS)

A hybrid (rule-based + ML-assisted) security and compliance platform for monitoring, analyzing, and detecting anomalous user behavior within an organization.

---

## 📁 Repository Structure

```
AuditMonitoringSystem/
├── frontend/        # Next.js dashboard (Admin, Manager, Employee views)
├── backend/         # Node.js/Express REST API
├── ml-service/      # Python FastAPI anomaly detection microservice
├── Docs/            # Project documentation (PRD, HLD/LLD, Design, etc.)
└── README.md
```

---

## 🛠️ Tech Stack

| Layer          | Technology                              |
|----------------|-----------------------------------------|
| Frontend       | Next.js, Tailwind CSS, shadcn/ui, Recharts |
| Backend        | Node.js, Express.js                     |
| ML Service     | Python, FastAPI, Scikit-learn           |
| Database       | PostgreSQL (Supabase / AWS RDS)         |
| Authentication | Firebase Authentication                 |
| Deployment     | Vercel (FE), Render/Railway (BE), Docker (ML) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- PostgreSQL database
- Firebase project

### 1. Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your Firebase config in .env.local
npm run dev
```

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in your DB credentials, Firebase Admin SDK, and ML service URL
npm run dev
```

### 3. ML Service
```bash
cd ml-service
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload
```

---

## 🔑 Firebase Setup (Required)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: **AuditMonitoringSystem**
3. Enable **Authentication** → Email/Password + Google OAuth
4. Generate a **Service Account Key** (`Project Settings → Service Accounts → Generate Key`)
5. Copy the Firebase Web App config and paste into `frontend/.env.local`
6. Copy the service account JSON details into `backend/.env`

---

## 🗄️ Database Setup

1. Provision a PostgreSQL instance (Supabase recommended)
2. Run migrations:
```bash
cd backend
npm run migrate
```

---

## 📖 Documentation

See the [`Docs/`](./Docs/) folder for:
- [`FinalPRD.md`](./Docs/FInalPRD.md) — Product Requirements
- [`HLD_LLD.md`](./Docs/HLD_LLD.md) — Architecture Design
- [`TechStack.md`](./Docs/TechStack.md) — Technology Decisions
- [`TODO.md`](./Docs/TODO.md) — Implementation Checklist

---

## 👥 Roles

| Role     | Access Level                       |
|----------|------------------------------------|
| Admin    | Full system access + ML controls   |
| Manager  | Team-level monitoring & alerts     |
| Employee | Personal activity logs & alerts    |
