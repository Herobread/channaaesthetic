import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface H2Props extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export default function H2({ children, className, ...props }: H2Props) {
  return (
    <h2 className={cn("text-2xl font-bold text-white", className)} {...props}>
      {children}
    </h2>
  );
}
