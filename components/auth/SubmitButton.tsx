"use client";

import { useFormStatus } from "react-dom";

const base =
  "w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-[15px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70";
const variants = {
  gold: "bg-gold-grad text-[#241a0c] shadow-[0_8px_26px_rgba(219,159,82,0.32)] hover:shadow-[0_12px_34px_rgba(219,159,82,0.45)] hover:-translate-y-px",
  line: "bg-transparent border border-line-2 text-[#F4F1EC] hover:border-gold hover:text-gold-bright",
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
