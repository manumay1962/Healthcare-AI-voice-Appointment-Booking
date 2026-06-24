"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/* ─── Inline SVG Icons ────────────────────────────── */
const Icons = {
  hospital: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M10 10h4"/><path d="M12 8v4"/></svg>
  ),
  phone: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
  ),
  mic: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
  ),
  monitor: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
  ),
  barChart: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  stethoscope: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
  ),
  clipboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
  ),
  trash: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
  ),
  inbox: (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
  ),
  bot: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/></svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  x: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  ),
  signal: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/></svg>
  ),
};

/* ─── Status badge helper ─────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    confirmed: { label: "Confirmed", cls: styles.badgeGreen },
    pending: { label: "Pending", cls: styles.badgeAmber },
    cancelled: { label: "Cancelled", cls: styles.badgeRed },
  };
  const s = map[status] || map.confirmed;
  return <span className={`${styles.badge} ${s.cls}`}>{s.label}</span>;
}

/* ─── Source badge helper ─────────────────────────── */
function SourceBadge({ source }) {
  const isVoice = source === "bolna-voice-agent";
  return (
    <span className={`${styles.sourceBadge} ${isVoice ? styles.sourceVoice : styles.sourceManual}`}>
      <span className={styles.sourceBadgeIcon}>{isVoice ? Icons.mic : Icons.monitor}</span>
      {isVoice ? "Voice AI" : "Dashboard"}
    </span>
  );
}

/* ─── Stat Card ───────────────────────────────────── */
function StatCard({ icon, label, value, delay }) {
  return (
    <div className={styles.statCard} style={{ animationDelay: `${delay}ms` }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{value}</span>
        <span className={styles.statLabel}>{label}</span>
      </div>
    </div>
  );
}

/* ─── Call AI Agent Section ───────────────────────── */
function CallAgentSection({ userPhone, userName }) {
  const [callStatus, setCallStatus] = useState(null);
  const [callMessage, setCallMessage] = useState("");

  const handleCall = async () => {
    if (!userPhone) return;
    setCallStatus("calling");
    setCallMessage("Connecting you to Sarah, our AI receptionist...");

    try {
      const res = await fetch(`${API_BASE}/call/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: userPhone, patientName: userName }),
      });
      const data = await res.json();

      if (data.success) {
        setCallStatus("success");
        setCallMessage(data.message);
      } else {
        setCallStatus("error");
        setCallMessage(data.message || "Failed to initiate call.");
      }
    } catch (err) {
      setCallStatus("error");
      setCallMessage("Could not connect to the server.");
    }
  };

  return (
    <section className={styles.callSection}>
      <div className={styles.callContent}>
        <div className={styles.callLeft}>
          <div className={styles.callIconWrap}>
            <span className={styles.callIconBig}>{Icons.phone}</span>
            <span className={styles.callPulseRing}></span>
            <span className={styles.callPulseRing2}></span>
          </div>
          <div>
            <h2 className={styles.callTitle}>Talk to Our AI Receptionist</h2>
            <p className={styles.callDesc}>
              Click the button and our Bolna-powered AI agent <strong>Sarah</strong> will call you at <strong>{userPhone}</strong> to schedule your appointment — entirely by voice.
            </p>
          </div>
        </div>
        <div className={styles.callRight}>
          <div className={styles.callBtnWrap}>
            <button
              className={`${styles.callBtnLarge} ${callStatus === "calling" ? styles.callBtnLoading : ""}`}
              onClick={handleCall}
              disabled={callStatus === "calling" || !userPhone}
            >
              {callStatus === "calling" ? (
                <><span className={styles.spinner}></span> Calling {userPhone}...</>
              ) : callStatus === "success" ? (
                <>Call Initiated</>
              ) : (
                <>Call Me Now at {userPhone}</>
              )}
            </button>
          </div>
          {callStatus && (
            <div className={`${styles.callFeedback} ${styles[`callFeedback_${callStatus}`]}`}>
              {callMessage}
            </div>
          )}
        </div>
      </div>
      <div className={styles.callSteps}>
        <div className={styles.callStep}><span className={styles.stepNum}>1</span><span>Click &quot;Call Me Now&quot;</span></div>
        <div className={styles.callStepArrow}></div>
        <div className={styles.callStep}><span className={styles.stepNum}>2</span><span>AI agent Sarah calls you</span></div>
        <div className={styles.callStepArrow}></div>
        <div className={styles.callStep}><span className={styles.stepNum}>3</span><span>Tell her your appointment details</span></div>
        <div className={styles.callStepArrow}></div>
        <div className={styles.callStep}><span className={styles.stepNum}>4</span><span>Appointment appears on dashboard</span></div>
      </div>
    </section>
  );
}

/* ─── Add Appointment Modal ───────────────────────── */
function AddModal({ onClose, onAdd, userName, userId }) {
  const [form, setForm] = useState({
    patientName: userName || "",
    date: "",
    time: "",
    reason: "",
    doctor: "Dr. Smith",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      });
      if (res.ok) { onAdd(); onClose(); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Schedule Appointment</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Patient Name</label>
            <input type="text" required placeholder="John Doe"
              value={form.patientName} onChange={(e) => setForm({ ...form, patientName: e.target.value })} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Date</label>
              <input type="date" required value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className={styles.formGroup}>
              <label>Time</label>
              <input type="time" required value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Doctor</label>
            <select value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })}>
              <option>Dr. Smith</option>
              <option>Dr. Patel</option>
              <option>Dr. Jones</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Reason for Visit</label>
            <textarea required placeholder="Describe the reason..."
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Booking..." : "Book Appointment"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE (Auth Protected)
   ═══════════════════════════════════════════════════ */
export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (!token || !savedUser) {
      router.push("/auth");
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
    } catch {
      router.push("/auth");
      return;
    }

    setAuthChecked(true);
  }, [router]);

  const fetchAppointments = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/appointments`);
      const json = await res.json();
      if (json.success) {
        setAppointments(json.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error("Failed to fetch:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 5000);
    return () => clearInterval(interval);
  }, [fetchAppointments, authChecked]);

  const handleDelete = async (id) => {
    try {
      await fetch(`${API_BASE}/appointments/${id}`, { method: "DELETE" });
      fetchAppointments();
    } catch (err) { console.error(err); }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  if (!authChecked) {
    return <main className={styles.main}><div style={{ textAlign: "center", padding: "100px", color: "var(--text-muted)" }}>Loading...</div></main>;
  }

  const totalAppointments = appointments.length;
  const voiceBookings = appointments.filter((a) => a.source === "bolna-voice-agent").length;
  const todayCount = appointments.filter(
    (a) => a.date === new Date().toISOString().split("T")[0]
  ).length;

  return (
    <main className={styles.main}>
      {/* ─── Header ────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>{Icons.hospital}</span>
            <div>
              <h1 className={styles.logoTitle}>City Health Clinic</h1>
              <p className={styles.logoSub}>AI-Powered Appointment Dashboard</p>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            <span>Live</span>
          </div>
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            + New Appointment
          </button>

          {/* ─── User Menu ─────────────────────── */}
          <div className={styles.userMenu}>
            <button className={styles.userBtn} onClick={() => router.push("/profile")}>
              <span className={styles.userAvatar}>
                {user?.avatar || user?.name?.charAt(0) || "U"}
              </span>
              <span className={styles.userNameText}>{user?.name}</span>
            </button>
            <button className={styles.logoutSmBtn} onClick={handleLogout} title="Logout">
              ⏻
            </button>
          </div>
        </div>
      </header>

      {/* ─── Welcome Banner ────────────────────── */}
      <div className={styles.welcomeBanner}>
        Welcome back, <strong>{user?.name}</strong>. Your phone <strong>{user?.phone}</strong> is ready for AI calls.
      </div>

      {/* ─── Call AI Agent (phone pre-filled) ──── */}
      <CallAgentSection userPhone={user?.phone || ""} userName={user?.name || ""} />

      {/* ─── Stats ─────────────────────────────── */}
      <section className={styles.stats}>
        <StatCard icon={Icons.barChart} label="Total Appointments" value={totalAppointments} delay={0} />
        <StatCard icon={Icons.mic} label="Voice AI Bookings" value={voiceBookings} delay={100} />
        <StatCard icon={Icons.calendar} label="Today's Appointments" value={todayCount} delay={200} />
        <StatCard icon={Icons.stethoscope} label="Available Doctors" value={3} delay={300} />
      </section>

      {/* ─── Agent Info Banner ─────────────────── */}
      <section className={styles.agentBanner}>
        <div className={styles.agentBannerContent}>
          <div className={styles.agentBannerLeft}>
            <span className={styles.agentIconWrap}>{Icons.bot}</span>
            <div>
              <h3>Bolna Voice AI Agent — Sarah</h3>
              <p>Patients can call the AI receptionist to automatically book appointments. Bookings appear here in real-time.</p>
            </div>
          </div>
          <div className={styles.agentBannerRight}>
            <span className={styles.agentStatus}>Active</span>
          </div>
        </div>
      </section>

      {/* ─── Appointments Table ────────────────── */}
      <section className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <h2>Appointments</h2>
          <span className={styles.countBadge}>{totalAppointments} total</span>
        </div>

        {loading ? (
          <div className={styles.skeletonWrap}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.skeleton}></div>
            ))}
          </div>
        ) : appointments.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>{Icons.inbox}</span>
            <h3>No appointments yet</h3>
            <p>Book one manually or let the Voice AI agent handle it.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Doctor</th>
                  <th>Reason</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, idx) => (
                  <tr key={apt.id} className={styles.tableRow} style={{ animationDelay: `${idx * 60}ms` }}>
                    <td>
                      <div className={styles.patientCell}>
                        <div className={styles.avatar}>{apt.patientName.charAt(0).toUpperCase()}</div>
                        <span>{apt.patientName}</span>
                      </div>
                    </td>
                    <td>{apt.date}</td>
                    <td>{apt.time}</td>
                    <td>{apt.doctor}</td>
                    <td className={styles.reasonCell}>{apt.reason}</td>
                    <td><SourceBadge source={apt.source} /></td>
                    <td><StatusBadge status={apt.status} /></td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(apt.id)} title="Delete">{Icons.trash}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Footer ────────────────────────────── */}
      <footer className={styles.footer}>
        <p>Powered by <strong>Bolna Voice AI</strong> &middot; Next.js &middot; Express</p>
      </footer>

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={fetchAppointments} userName={user?.name} userId={user?.id} />}
    </main>
  );
}
