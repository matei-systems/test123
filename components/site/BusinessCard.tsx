import Link from "next/link";
import { categoryLabel, initials, type PublicBusiness } from "@/lib/directory";

export function BusinessAvatar({ name, logoUrl, size = 56 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={logoUrl}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="shrink-0 rounded-2xl border border-line bg-surface object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-2xl bg-accent-strong/10 font-display font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials(name)}
    </span>
  );
}

export default function BusinessCard({ b }: { b: PublicBusiness }) {
  return (
    <Link
      href={`/geschaefte/${b.slug}`}
      className="card card-hover group flex h-full flex-col gap-4 p-5"
    >
      <div className="flex items-start gap-4">
        <BusinessAvatar name={b.display_name} logoUrl={b.logo_url} />
        <div className="min-w-0">
          <h3 className="truncate font-display text-xl font-semibold leading-tight group-hover:text-accent">{b.display_name}</h3>
          <p className="mt-1 text-sm text-muted">
            {categoryLabel(b.category)}
            {b.city ? ` · ${b.city}` : ""}
          </p>
        </div>
      </div>
      {b.tagline && <p className="line-clamp-2 text-[15px] leading-relaxed text-muted">{b.tagline}</p>}
      <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent">
        Profil & Belohnungen ansehen <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
