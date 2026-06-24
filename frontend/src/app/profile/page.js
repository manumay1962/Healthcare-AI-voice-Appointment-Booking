"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Edit form
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth");
      return;
    }
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth");
        return;
      }

      setUser(data.user);
      setAppointments(data.appointments || []);
      setEditName(data.user.name);
      setEditPhone(data.user.phone);
      setEditEmail(data.user.email || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      const body = { name: editName, phone: editPhone, email: editEmail };
      if (currentPassword && newPassword) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }

      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!data.success) {
        setMessage({ type: "error", text: data.message });
        return;
      }

      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      setEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  if (loading) {
    return (
      <main className={styles.profilePage}>
        <div className={styles.loading}>Loading profile...</div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className={styles.profilePage}>
      {/* ─── Header ────────────────────────────── */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/")}>
          ← Dashboard
        </button>
        <h1>My Profile</h1>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>

      {message.text && (
        <div className={`${styles.message} ${styles[`message_${message.type}`]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        {/* ─── Profile Card ──────────────────── */}
        <section className={styles.profileCard}>
          <div className={styles.avatarLarge}>
            {user.avatar || user.name.charAt(0).toUpperCase()}
          </div>

          {!editing ? (
            /* ─── View Mode ──────────────────── */
            <div className={styles.profileInfo}>
              <h2 className={styles.userName}>{user.name}</h2>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Phone</span>
                  <span className={styles.infoValue}>{user.phone}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Email</span>
                  <span className={styles.infoValue}>{user.email || "Not set"}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Member Since</span>
                  <span className={styles.infoValue}>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Appointments</span>
                  <span className={styles.infoValue}>{appointments.length} total</span>
                </div>
              </div>
              <button className={styles.editBtn} onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          ) : (
            /* ─── Edit Mode ──────────────────── */
            <form onSubmit={handleSave} className={styles.editForm}>
              <h3 className={styles.editTitle}>Edit Profile</h3>
              <div className={styles.formGroup}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className={styles.divider}>
                <span>Change Password (optional)</span>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.editActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => {
                  setEditing(false);
                  setEditName(user.name);
                  setEditPhone(user.phone);
                  setEditEmail(user.email || "");
                  setCurrentPassword("");
                  setNewPassword("");
                }}>
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ─── User Appointments ─────────────── */}
        <section className={styles.appointmentsSection}>
          <h3>My Appointments</h3>
          {appointments.length === 0 ? (
            <div className={styles.emptyAppts}>
              <p>No appointments yet. Book one from the dashboard.</p>
            </div>
          ) : (
            <div className={styles.apptList}>
              {appointments.map((apt) => (
                <div key={apt.id} className={styles.apptCard}>
                  <div className={styles.apptTop}>
                    <span className={styles.apptDate}>{apt.date}</span>
                    <span className={styles.apptTime}>{apt.time}</span>
                    <span className={`${styles.apptBadge} ${
                      apt.source === "bolna-voice-agent" ? styles.apptVoice : styles.apptManual
                    }`}>
                      {apt.source === "bolna-voice-agent" ? "Voice AI" : "Manual"}
                    </span>
                  </div>
                  <div className={styles.apptBottom}>
                    <span>{apt.doctor}</span>
                    <span>{apt.reason}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
