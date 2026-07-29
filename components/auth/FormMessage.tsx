export function ErrorMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-5 text-sm rounded-lg px-3 py-2.5 bg-[rgba(239,68,68,0.12)] text-[#FCA5A5] border border-[rgba(239,68,68,0.2)]">
      {children}
    </div>
  );
}

export function SuccessMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="mb-5 text-sm rounded-lg px-3 py-2.5 bg-[rgba(74,222,128,0.1)] text-[#86EFAC] border border-[rgba(74,222,128,0.2)]">
      {children}
    </div>
  );
}

export function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className="mb-4">
      <label className="block text-[13px] text-dim mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-ink border border-line text-[#F4F1EC] px-3.5 py-3 rounded-xl text-[15px] outline-none transition-all focus:border-gold focus:shadow-[0_0_0_3px_rgba(232,181,115,0.16)] placeholder:text-faint"
      />
    </div>
  );
}
