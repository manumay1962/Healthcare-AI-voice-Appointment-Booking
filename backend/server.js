require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "city-health-clinic-secret-2026";
const MONGODB_URI = process.env.MONGODB_URI || "";

// ─── MongoDB Connection ─────────────────────────────────────
let useMongo = false;
let User, Appointment;

async function connectDB() {
  if (!MONGODB_URI) {
    console.log("[DB] No MONGODB_URI set — using in-memory storage");
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    useMongo = true;
    User = require("./models/User");
    Appointment = require("./models/Appointment");
    console.log("[DB] Connected to MongoDB");
  } catch (err) {
    console.error("[DB] MongoDB connection failed, falling back to in-memory:", err.message);
    useMongo = false;
  }
}

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());

// Capture raw body for debugging Bolna's malformed JSON
app.use(express.text({ type: 'application/json' }));
app.use((req, res, next) => {
  if (typeof req.body === 'string') {
    req.rawBody = req.body;
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      console.log("[WARN] Malformed JSON from Bolna. Attempting to clean...");
      try {
        // Fix Bolna's common bug where it double-quotes values like ""value""
        let cleaned = req.rawBody.replace(/""/g, '"');
        req.body = JSON.parse(cleaned);
      } catch (e2) {
        console.log("[ERROR] Failed to parse even after cleaning.");
      }
    }
  }
  next();
});

app.use(express.urlencoded({ extended: true }));

let lastWebhookReceived = null;

// ─── In-Memory Stores (fallback when MongoDB is not available) ──
let memoryUsers = [];
let memoryAppointments = [
  {
    id: uuidv4(),
    patientName: "Jane Miller",
    date: "2026-05-15",
    time: "10:00 AM",
    reason: "Annual checkup",
    doctor: "Dr. Smith",
    status: "confirmed",
    source: "manual",
    userId: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    patientName: "Robert Chen",
    date: "2026-05-15",
    time: "2:30 PM",
    reason: "Follow-up on blood work",
    doctor: "Dr. Patel",
    status: "confirmed",
    source: "manual",
    userId: null,
    createdAt: new Date().toISOString(),
  },
];

// ─── Auth Middleware ─────────────────────────────────────────
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
}

// ═══════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// ─── POST /api/auth/register ────────────────────────────────
app.post("/api/auth/register", async (req, res) => {
  const { name, phone, password, email } = req.body;

  if (!name || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, phone number, and password are required",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (useMongo) {
    try {
      const exists = await User.findOne({ phone });
      if (exists) {
        return res.status(409).json({ success: false, message: "Phone number already registered" });
      }

      const user = await User.create({
        name,
        phone,
        email: email || "",
        password: hashedPassword,
        avatar: name.charAt(0).toUpperCase(),
      });

      const token = jwt.sign({ id: user._id.toString(), phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
      console.log(`[Auth] New user registered: ${name} (${phone})`);

      return res.status(201).json({
        success: true,
        token,
        user: { id: user._id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar },
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ success: false, message: "Phone number already registered" });
      }
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // In-memory fallback
  if (memoryUsers.find((u) => u.phone === phone)) {
    return res.status(409).json({ success: false, message: "Phone number already registered" });
  }

  const user = {
    id: uuidv4(),
    name,
    phone,
    email: email || "",
    password: hashedPassword,
    avatar: name.charAt(0).toUpperCase(),
    createdAt: new Date().toISOString(),
  };

  memoryUsers.push(user);
  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
  console.log(`[Auth] New user registered: ${name} (${phone})`);

  res.status(201).json({
    success: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar },
  });
});

// ─── POST /api/auth/login ───────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  const { phone, email, password } = req.body;

  if ((!phone && !email) || !password) {
    return res.status(400).json({ success: false, message: "Phone or email, and password required" });
  }

  let user;

  if (useMongo) {
    const query = phone ? { phone } : { email };
    const dbUser = await User.findOne(query);
    if (!dbUser) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, dbUser.password);
    if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: dbUser._id.toString(), phone: dbUser.phone }, JWT_SECRET, { expiresIn: "7d" });
    console.log(`[Auth] User logged in: ${dbUser.name}`);

    return res.json({
      success: true,
      token,
      user: { id: dbUser._id, name: dbUser.name, phone: dbUser.phone, email: dbUser.email, avatar: dbUser.avatar },
    });
  }

  // In-memory fallback
  user = memoryUsers.find((u) =>
    (phone && u.phone === phone) || (email && u.email === email)
  );
  if (!user) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ success: false, message: "Invalid credentials" });

  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });
  console.log(`[Auth] User logged in: ${user.name}`);

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar },
  });
});

// ─── GET /api/auth/profile ──────────────────────────────────
app.get("/api/auth/profile", authMiddleware, async (req, res) => {
  if (useMongo) {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const userAppointments = await Appointment.find({
      $or: [
        { userId: user._id },
        { patientName: { $regex: new RegExp(`^${user.name}$`, "i") } },
      ],
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
      appointments: userAppointments.map((a) => ({
        id: a._id,
        patientName: a.patientName,
        date: a.date,
        time: a.time,
        reason: a.reason,
        doctor: a.doctor,
        status: a.status,
        source: a.source,
        userId: a.userId,
        createdAt: a.createdAt,
      })),
    });
  }

  // In-memory fallback
  const user = memoryUsers.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const userAppointments = memoryAppointments.filter(
    (a) => a.userId === user.id || a.patientName.toLowerCase() === user.name.toLowerCase()
  );

  res.json({
    success: true,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
    appointments: userAppointments,
  });
});

// ─── PUT /api/auth/profile ──────────────────────────────────
app.put("/api/auth/profile", authMiddleware, async (req, res) => {
  const { name, phone, email, currentPassword, newPassword } = req.body;

  if (useMongo) {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name;
    if (email !== undefined) user.email = email;
    if (phone) {
      const existing = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ success: false, message: "Phone number already in use" });
      user.phone = phone;
    }

    if (currentPassword && newPassword) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });
      user.password = await bcrypt.hash(newPassword, 10);
    }

    user.avatar = (user.name || "U").charAt(0).toUpperCase();
    await user.save();

    console.log(`[Auth] Profile updated for ${user.name}`);
    return res.json({
      success: true,
      user: { id: user._id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
    });
  }

  // In-memory fallback
  const user = memoryUsers.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  if (name) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone) {
    const existing = memoryUsers.find((u) => u.phone === phone && u.id !== user.id);
    if (existing) return res.status(409).json({ success: false, message: "Phone number already in use" });
    user.phone = phone;
  }

  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  user.avatar = (user.name || "U").charAt(0).toUpperCase();
  console.log(`[Auth] Profile updated for ${user.name}`);

  res.json({
    success: true,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
  });
});

// ═══════════════════════════════════════════════════════════
//  APPOINTMENT ROUTES
// ═══════════════════════════════════════════════════════════

app.get("/api/appointments", async (req, res) => {
  if (useMongo) {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    return res.json({
      success: true,
      count: appointments.length,
      data: appointments.map((a) => ({
        id: a._id,
        patientName: a.patientName,
        date: a.date,
        time: a.time,
        reason: a.reason,
        doctor: a.doctor,
        status: a.status,
        source: a.source,
        userId: a.userId,
        createdAt: a.createdAt,
      })),
    });
  }

  const sorted = [...memoryAppointments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ success: true, count: sorted.length, data: sorted });
});

app.post("/api/appointments", async (req, res) => {
  const { patientName, date, time, reason, doctor, userId } = req.body;

  if (!patientName || !date || !time || !reason) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: patientName, date, time, reason",
    });
  }

  if (useMongo) {
    const appointment = await Appointment.create({
      patientName,
      date,
      time,
      reason,
      doctor: doctor || "Dr. Smith",
      status: "confirmed",
      source: "dashboard",
      userId: userId || null,
    });

    console.log(`[Dashboard] New appointment booked for ${patientName}`);
    return res.status(201).json({
      success: true,
      data: {
        id: appointment._id,
        patientName: appointment.patientName,
        date: appointment.date,
        time: appointment.time,
        reason: appointment.reason,
        doctor: appointment.doctor,
        status: appointment.status,
        source: appointment.source,
        userId: appointment.userId,
        createdAt: appointment.createdAt,
      },
    });
  }

  const appointment = {
    id: uuidv4(),
    patientName,
    date,
    time,
    reason,
    doctor: doctor || "Dr. Smith",
    status: "confirmed",
    source: "dashboard",
    userId: userId || null,
    createdAt: new Date().toISOString(),
  };

  memoryAppointments.push(appointment);
  console.log(`[Dashboard] New appointment booked for ${patientName}`);
  res.status(201).json({ success: true, data: appointment });
});

app.get("/api/debug/last-webhook", (req, res) => {
  res.json({ 
    success: true, 
    lastWebhookReceived,
    hint: "If this is null, the backend hasn't received any webhook calls yet."
  });
});

app.post("/api/webhook/bolna", async (req, res) => {
  console.log("\n--- BOLNA WEBHOOK RECEIVED ---");
  
  let body = req.body;
  lastWebhookReceived = body;
  
  console.log("Body:", JSON.stringify(body, null, 2));

  const patientName =
    body.patientName || body.patient_name || body.name || body.caller_name ||
    (body.data && body.data.patientName) || (body.data && body.data.name) || "Unknown Patient";
  const date =
    body.date || body.appointment_date || body.preferred_date ||
    (body.data && body.data.date) || new Date().toISOString().split("T")[0];
  const time =
    body.time || body.appointment_time || body.preferred_time ||
    (body.data && body.data.time) || "TBD";
  const reason =
    body.reason || body.visit_reason || body.reason_for_visit ||
    (body.data && body.data.reason) || "General Consultation";
  const doctor =
    body.doctor || body.preferred_doctor ||
    (body.data && body.data.doctor) || "Dr. Smith";

  let assignedUserId = null;

  if (useMongo) {
    if (patientName !== "Unknown Patient") {
      const matchedUser = await User.findOne({
        name: { $regex: new RegExp(`^${patientName}$`, "i") },
      });
      if (matchedUser) {
        assignedUserId = matchedUser._id;
        console.log(`[Webhook] Linked appointment to user: ${matchedUser.name}`);
      }
    }

    const appointment = await Appointment.create({
      patientName,
      date,
      time,
      reason,
      doctor,
      status: "confirmed",
      source: "bolna-voice-agent",
      userId: assignedUserId,
    });

    console.log(`[Bolna Agent] Appointment booked for ${patientName}`);
    console.log("-----------------------------\n");

    return res.status(200).json({
      success: true,
      message: `Appointment successfully booked for ${patientName} on ${date} at ${time}.`,
      appointment_id: appointment._id,
    });
  }

  // In-memory fallback
  if (patientName !== "Unknown Patient") {
    const matchedUser = memoryUsers.find(u => u.name && u.name.toLowerCase() === patientName.toLowerCase());
    if (matchedUser) {
      assignedUserId = matchedUser.id;
      console.log(`[Webhook] Linked appointment to user: ${matchedUser.name}`);
    }
  }

  const appointment = {
    id: uuidv4(),
    patientName,
    date,
    time,
    reason,
    doctor,
    status: "confirmed",
    source: "bolna-voice-agent",
    userId: assignedUserId,
    createdAt: new Date().toISOString(),
  };

  memoryAppointments.push(appointment);
  console.log(`[Bolna Agent] Appointment booked for ${patientName}`);
  console.log("-----------------------------\n");

  res.status(200).json({
    success: true,
    message: `Appointment successfully booked for ${patientName} on ${date} at ${time}.`,
    appointment_id: appointment.id,
  });
});

app.delete("/api/appointments/:id", async (req, res) => {
  const { id } = req.params;

  if (useMongo) {
    const result = await Appointment.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ success: false, message: "Appointment not found" });
    return res.json({ success: true, message: "Appointment deleted" });
  }

  const index = memoryAppointments.findIndex((a) => a.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Appointment not found" });
  memoryAppointments.splice(index, 1);
  res.json({ success: true, message: "Appointment deleted" });
});

app.patch("/api/appointments/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (useMongo) {
    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: status || "confirmed" },
      { new: true }
    );
    if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
    return res.json({ success: true, data: appointment });
  }

  const appointment = memoryAppointments.find((a) => a.id === id);
  if (!appointment) return res.status(404).json({ success: false, message: "Appointment not found" });
  appointment.status = status || "confirmed";
  res.json({ success: true, data: appointment });
});

// ═══════════════════════════════════════════════════════════
//  BOLNA CALL API
// ═══════════════════════════════════════════════════════════

app.post("/api/call/initiate", async (req, res) => {
  let { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: "Phone number is required" });
  }

  phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  if (!phoneNumber.startsWith("+")) {
    if (phoneNumber.startsWith("91") && phoneNumber.length >= 12) {
      phoneNumber = "+" + phoneNumber;
    } else {
      phoneNumber = "+91" + phoneNumber;
    }
  }

  const BOLNA_API_KEY = process.env.BOLNA_API_KEY;
  const BOLNA_AGENT_ID = process.env.BOLNA_AGENT_ID;

  if (!BOLNA_API_KEY || BOLNA_API_KEY === "your_bolna_api_key_here") {
    return res.json({
      success: true, simulated: true,
      message: `Demo mode: Would call ${phoneNumber}. Configure BOLNA_API_KEY for real calls.`,
      call_id: uuidv4(),
    });
  }

  try {
    const response = await fetch("https://api.bolna.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BOLNA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        agent_id: BOLNA_AGENT_ID,
        recipient_phone_number: phoneNumber,
      }),
    });

    const data = await response.json();
    console.log(`[Bolna API] Call initiated to ${phoneNumber}`, data);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: data.message || "Failed to initiate call. Please check your Bolna API key and settings.",
        error: data
      });
    }

    res.json({
      success: true, simulated: false,
      message: `AI agent is calling ${phoneNumber} now!`,
      data,
    });
  } catch (error) {
    console.error("[ERROR] Bolna API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to initiate call", error: error.message });
  }
});

// ─── Health Check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: useMongo ? "mongodb" : "in-memory",
    uptime: process.uptime(),
    timestamp: new Date(),
  });
});

// ─── Start Server ───────────────────────────────────────────
async function start() {
  await connectDB();

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`\nCity Health Clinic Backend running on port ${PORT}`);
      console.log(`  Database:     ${useMongo ? "MongoDB" : "In-memory"}`);
      console.log(`  Appointments: http://localhost:${PORT}/api/appointments`);
      console.log(`  Webhook:      http://localhost:${PORT}/api/webhook/bolna`);
      console.log(`  Auth:         http://localhost:${PORT}/api/auth/register`);
      console.log(`  Health:       http://localhost:${PORT}/api/health\n`);
    });
  }
}

start();

module.exports = app;
