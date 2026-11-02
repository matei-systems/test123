import Link from "next/link";
import CustomerScanner from "@/components/konto/CustomerScanner";

export const metadata = { title: "QR-Code scannen" };

export default function ScannenPage() {
  return (
    <div className="enter">
      <Link href="/konto" className="text-sm text-muted hover:text-accent">
        ← Wallet
      </Link>
      <h1 className="mt-4 font-display text-[34px] font-semibold leading-tight">QR-Code scannen</h1>
      <p className="mt-2 max-w-xl text-[15px] text-muted">
        Scanne den QR-Code am Tresen eines teilnehmenden Geschäfts, um dir dort eine Karte zu holen. Die Kamera wird nur in deinem
        Browser ausgewertet – es werden keine Bilder hochgeladen.
      </p>
      <div className="mt-6">
        <CustomerScanner />
      </div>
      <p className="mt-6 text-center text-sm text-faint">
        Du willst Stempel sammeln? Dafür zeigst du <Link href="/konto" className="font-semibold text-accent">deine Karte</Link> vor – das
        Geschäft scannt sie.
      </p>
    </div>
  );
}
