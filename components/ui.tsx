import Link from "next/link";
import { ComponentProps } from "react";

// Small set of shared, unstyled-ish primitives so pages stay consistent
// without pulling in a component library for the MVP.

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<"button"> & { variant?: "primary" | "outline" | "ghost" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    outline: "border border-border hover:bg-surface",
    ghost: "hover:bg-surface",
  }[variant];
  return (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed ${styles} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({
  className = "",
  variant = "primary",
  ...props
}: ComponentProps<typeof Link> & { variant?: "primary" | "outline" }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    outline: "border border-border hover:bg-surface",
  }[variant];
  return (
    <Link
      className={`inline-block rounded-lg px-4 py-2 text-sm font-medium transition ${styles} ${className}`}
      {...props}
    />
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return (
    <input
      className={`w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
      {...props}
    />
  );
}

export function Textarea({
  className = "",
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={`w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${className}`}
      {...props}
    />
  );
}

export function Label({ className = "", ...props }: ComponentProps<"label">) {
  return (
    <label
      className={`block text-sm font-medium mb-1 ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label>
        {label}
        {required && <span className="text-brand"> *</span>}
      </Label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Card({
  className = "",
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={`rounded-xl border border-border bg-white p-5 ${className}`}
      {...props}
    />
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-surface border border-border px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}
