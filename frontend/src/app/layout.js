import "./globals.css";

export const metadata = {
  title: "City Health Clinic | AI-Powered Appointment Dashboard",
  description:
    "Smart healthcare appointment management powered by Bolna Voice AI. Schedule, track, and manage patient appointments seamlessly.",
  keywords: "healthcare, appointments, voice AI, Bolna, clinic dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
