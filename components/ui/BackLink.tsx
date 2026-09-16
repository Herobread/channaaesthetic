import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ComponentPropsWithoutRef, ReactNode } from "react";

export interface BackLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  children?: ReactNode;
  icon?: ReactNode;
}

export default function BackLink({
  children = "Back",
  icon = <ArrowLeft className="w-4 h-4 shrink-0" />,
  className = "",
  ...props
}: BackLinkProps) {
  return (
    <Link
      {...props}
      className={`inline-flex items-center text-caption font-sans text-text-muted gap-1.5 hover:text-text-primary transition-colors focus-ring rounded-control w-fit ${className}`.trim()}
    >
      {icon}
      {children}
    </Link>
  );
}
