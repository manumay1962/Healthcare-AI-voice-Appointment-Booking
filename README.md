# 🏥 City Health Clinic — AI-Powered Appointment Scheduler

> A full-stack voice AI application using **Bolna** that allows patients to book medical appointments via a phone call. The AI receptionist ("Sarah") collects patient details and books the appointment automatically. The clinic admin dashboard displays appointments in real-time.

## 🎯 Problem Statement

Medical clinics face high call volumes leading to:
- Long hold times for patients
- Overburdened administrative staff
- Missed appointment opportunities

**Solution:** A Voice AI agent that handles inbound calls 24/7, collects patient information, and schedules appointments autonomously — with a real-time admin dashboard for clinic staff.

## 🏗️ Architecture

```
Patient (Phone Call)
      │
      ▼
┌─────────────────┐
│  Bolna Voice AI  │  ← System Prompt + FAQ Knowledge Base
│  Agent "Sarah"   │
└────────┬────────┘
         │ Webhook (POST)
         ▼
┌─────────────────┐
│  Express Backend │  ← /api/webhook/bolna
│  (Node.js)       │  ← /api/appointments (CRUD)
└────────┬────────┘
         │ REST API
         ▼
┌─────────────────┐
│  Next.js Frontend│  ← Clinic Admin Dashboard
│  (React)         │  ← Real-time polling (5s)
└─────────────────┘
```

## 📊 Outcome Metrics

| Metric | Target |
|--------|--------|
| Administrative call volume reduction | 30% |
| Average hold time | → 0 seconds |
| Appointment booking success rate | 95%+ |
| Agent response time | < 2 seconds |

## 🛠️ Tech Stack

- **Voice AI**: [Bolna.dev](https://bolna.dev) (Agent + Telephony)
- **Backend**: Node.js + Express
- **Frontend**: Next.js 15 (React)
- **Database**: In-memory (demo) — can be swapped with PostgreSQL/MongoDB
- **Tunnel**: LocalTunnel / Ngrok (for webhook exposure)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Bolna account with an agent configured

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/bolna-healthcare-agent.git
cd bolna-healthcare-agent
```

### 2. Start the Backend
```bash
cd backend
npm install
cp .env.example .env  # Add your Bolna API key
npm start
```
The backend runs on `http://localhost:3001`

### 3. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:3000`

### 4. Expose Backend for Bolna Webhook
```bash
cd backend
npm run tunnel
```
Copy the generated public URL and paste it into your Bolna agent's tool/webhook configuration as:
`https://YOUR_TUNNEL_URL/api/webhook/bolna`

## 📸 Screenshots

*Dashboard showing real-time appointments booked via Voice AI and manual entry.*

## 🎙️ Bolna Agent Configuration

**Agent Name:** Sarah — City Health Clinic Receptionist

**System Prompt:** See `docs/bolna-config.md`

**Tool Configuration:**
```json
{
  "name": "book_appointment",
  "description": "Book a medical appointment for the patient",
  "parameters": {
    "patientName": "string (required)",
    "date": "string (required, YYYY-MM-DD)",
    "time": "string (required)",
    "reason": "string (required)",
    "doctor": "string (optional)"
  }
}
```

## 📂 Project Structure
```
bolna-healthcare-agent/
├── backend/
│   ├── server.js          # Express server + webhook + API
│   ├── .env               # Environment variables
│   └── package.json
├── frontend/
│   ├── src/app/
│   │   ├── page.js        # Dashboard page
│   │   ├── page.module.css # Dashboard styles
│   │   ├── globals.css    # Global design system
│   │   └── layout.js      # Root layout
│   └── package.json
└── README.md
```

## 📝 License

MIT

## 👤 Author

Built for the Bolna Full Stack Engineering Assignment.
