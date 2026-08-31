import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface H3Props extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export default function H3({ children, className, ...props }: H3Props) {
  return (
    <h3 className={cn("text-lg font-bold text-white", className)} {...props}>
      {children}
    </h3>
  );
}
