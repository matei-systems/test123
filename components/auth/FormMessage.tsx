export function ErrorMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="alert" className="mb-5 text-sm rounded-xl px-3.5 py-3 bg-danger/[0.08] text-danger border border-danger/[0.2]">
      {children}
    </div>
  );
}

export function SuccessMessage({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div role="status" className="mb-5 text-sm rounded-xl px-3.5 py-3 bg-forest/[0.08] text-forest border border-forest/[0.2]">
      {children}
    </div>
  );
}

export function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  const id = props.id ?? (props.name ? `f-${props.name}` : undefined);
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-[13px] font-semibold text-dim mb-1.5">
        {label}
      </label>
      <input
        {...props}
        id={id}
        aria-describedby={hint && id ? `${id}-hint` : undefined}
        className="w-full min-h-[46px] bg-ink border border-line-2 text-fg px-3.5 py-3 rounded-xl text-[16px] outline-none transition-all focus:border-gold focus:bg-surface focus:shadow-[0_0_0_3px_rgb(var(--accent-strong)/0.16)] placeholder:text-faint"
      />
      {hint && (
        <p id={id ? `${id}-hint` : undefined} className="mt-1.5 text-xs text-faint">
          {hint}
        </p>
      )}
    </div>
  );
}
