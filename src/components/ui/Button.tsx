import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "pro" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-red text-bg font-semibold hover:bg-red/90 shadow-[0_0_20px_rgba(255,40,0,0.4)] hover:shadow-[0_0_30px_rgba(255,40,0,0.65)]",
  pro: "bg-gradient-to-r from-magenta to-violet text-bg font-semibold shadow-[0_0_20px_rgba(232,121,249,0.4)] hover:shadow-[0_0_30px_rgba(232,121,249,0.6)]",
  outline: "border border-line bg-surface/60 text-ink hover:border-red/60 hover:text-red hover:shadow-[0_0_16px_rgba(255,40,0,0.25)]",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger: "border border-line text-muted hover:border-red/60 hover:bg-red/10 hover:text-red",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-base rounded-xl gap-2",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center whitespace-nowrap transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red",
    variants[variant],
    sizes[size],
    className,
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

type LinkButtonProps = React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function LinkButton({ variant, size, className, ...props }: LinkButtonProps) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
