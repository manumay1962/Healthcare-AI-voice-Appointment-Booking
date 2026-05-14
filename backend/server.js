require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "city-health-clinic-secret-2026";

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString(encoding || 'utf8'));
    } catch (e) {
      console.log("⚠️ Raw Invalid JSON from Bolna:", buf.toString(encoding || 'utf8'));
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.log("⚠️ Caught SyntaxError. Attempting to recover...");
    try {
      // Fix Bolna's bug where it inserts ""value"" instead of "value"
      let cleanedBody = req.rawBody.replace(/""/g, '"');
      const fixedBody = eval('(' + cleanedBody + ')'); 
      req.body = fixedBody;
      return next();
    } catch (e) {
      console.log("Failed to recover JSON:", e);
    }
  }
  next(err);
});
app.use(express.urlencoded({ extended: true }));

// ─── In-Memory Stores ───────────────────────────────────────
let users = [];
let appointments = [
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
//  AUTH ROUTES (Phone Number Based)
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

  // Check if phone already exists
  if (users.find((u) => u.phone === phone)) {
    return res.status(409).json({ success: false, message: "Phone number already registered" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    phone,
    email: email || "",
    password: hashedPassword,
    avatar: name.charAt(0).toUpperCase(),
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });

  console.log(`✅ [Auth] New user registered: ${name} (${phone})`);

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

  // Find user by phone or email
  const user = users.find((u) =>
    (phone && u.phone === phone) || (email && u.email === email)
  );
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: "7d" });

  console.log(`✅ [Auth] User logged in: ${user.name}`);

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar },
  });
});

// ─── GET /api/auth/profile ──────────────────────────────────
app.get("/api/auth/profile", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const userAppointments = appointments.filter(
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
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { name, phone, email, currentPassword, newPassword } = req.body;

  if (name) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone) {
    const existing = users.find((u) => u.phone === phone && u.id !== user.id);
    if (existing) return res.status(409).json({ success: false, message: "Phone number already in use" });
    user.phone = phone;
  }

  // Password change
  if (currentPassword && newPassword) {
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, message: "Current password is incorrect" });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  user.avatar = (user.name || "U").charAt(0).toUpperCase();

  console.log(`📝 [Auth] Profile updated for ${user.name}`);

  res.json({
    success: true,
    user: { id: user.id, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, createdAt: user.createdAt },
  });
});

// ═══════════════════════════════════════════════════════════
//  APPOINTMENT ROUTES
// ═══════════════════════════════════════════════════════════

app.get("/api/appointments", (req, res) => {
  const sorted = [...appointments].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json({ success: true, count: sorted.length, data: sorted });
});

app.post("/api/appointments", (req, res) => {
  const { patientName, date, time, reason, doctor, userId } = req.body;

  if (!patientName || !date || !time || !reason) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: patientName, date, time, reason",
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

  appointments.push(appointment);
  console.log(`✅ [Dashboard] New appointment booked for ${patientName}`);
  res.status(201).json({ success: true, data: appointment });
});

app.post("/api/webhook/bolna", (req, res) => {
  console.log("\n📞 ─── BOLNA WEBHOOK RECEIVED ───");
  
  // Bolna might send the data inside req.body.data or req.body directly
  // Sometimes it sends it as a string if the JSON was malformed
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch(e) {}
  }
  
  console.log("Body:", JSON.stringify(body, null, 2));

  // If body is completely empty, Bolna sent an empty request due to "param": {}
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

  // Match user by name (case insensitive) to link appointment to profile
  let assignedUserId = null;
  if (patientName !== "Unknown Patient") {
    const matchedUser = users.find(u => u.name && u.name.toLowerCase() === patientName.toLowerCase());
    if (matchedUser) {
      assignedUserId = matchedUser.id;
      console.log(`🔗 Linked appointment to user: ${matchedUser.name}`);
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

  appointments.push(appointment);
  console.log(`✅ [Bolna Agent] Appointment booked for ${patientName}`);
  console.log("───────────────────────────────\n");

  res.status(200).json({
    success: true,
    message: `Appointment successfully booked for ${patientName} on ${date} at ${time}.`,
    appointment_id: appointment.id,
  });
});

app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const index = appointments.findIndex((a) => a.id === id);
  if (index === -1) return res.status(404).json({ success: false, message: "Appointment not found" });
  appointments.splice(index, 1);
  res.json({ success: true, message: "Appointment deleted" });
});

app.patch("/api/appointments/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const appointment = appointments.find((a) => a.id === id);
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

  // Strip spaces, dashes, parentheses for clean E.164 format
  phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, "");

  // Auto-add + country code if not present
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
    console.log(`📞 [Bolna API] Call initiated to ${phoneNumber}`, data);

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
    console.error("❌ Bolna API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to initiate call", error: error.message });
  }
});

// ─── Health Check ───────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date() });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🏥 City Health Clinic Backend running on port ${PORT}`);
    console.log(`   📋 Appointments: http://localhost:${PORT}/api/appointments`);
    console.log(`   📞 Webhook:      http://localhost:${PORT}/api/webhook/bolna`);
    console.log(`   🔐 Auth:         http://localhost:${PORT}/api/auth/register`);
    console.log(`   💚 Health:       http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
