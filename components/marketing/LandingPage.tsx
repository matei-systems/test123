import QRCode from "qrcode";
import LandingClient from "@/components/marketing/LandingClient";

// Server-Anteil bewusst minimal: nur der QR-Code (braucht Node-seitiges
// `qrcode`, kein Grund das im Client zu duplizieren) wird hier vorberechnet.
// Alles Sichtbare (Text, Theme, Sprache) lebt in LandingClient, weil es auf
// clientseitigen Zustand (Hell/Dunkel, DE/EN) reagieren muss.
export default async function LandingPage() {
  const heroQr = await QRCode.toDataURL("https://matei.systems/c/demo", {
    margin: 1,
    width: 160,
    color: { dark: "#111111", light: "#ffffff" },
  });

  return <LandingClient heroQr={heroQr} />;
}
