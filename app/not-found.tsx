import Link from "next/link";
import AuthShell from "@/components/auth/AuthShell";

export default function NotFound() {
  return (
    <AuthShell eyebrow="404" title="Seite nicht gefunden" subtitle="Diese Seite gibt es nicht (mehr) - oder der Link ist fehlerhaft.">
      <Link href="/" className="btn btn-primary w-full">
        Zur Startseite
      </Link>
    </AuthShell>
  );
}
