"use client";

import { useFormStatus } from "react-dom";

const base =
  "w-full inline-flex min-h-[48px] items-center justify-center gap-2 px-5 py-3 rounded-full text-[15px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70";
const variants = {
  gold: "bg-accent-strong text-on-accent shadow-[0_8px_20px_-10px_rgb(var(--accent-strong)/0.7)] hover:bg-accent hover:-translate-y-px",
  line: "bg-transparent border border-line-2 text-fg hover:border-gold hover:text-gold-bright",
};

export default function SubmitButton({
  children,
  pendingText,
  variant = "gold",
}: {
  children: React.ReactNode;
  pendingText: string;
  variant?: "gold" | "line";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${base} ${variants[variant]}`}>
      {pending && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {pending ? pendingText : children}
    </button>
  );
}
