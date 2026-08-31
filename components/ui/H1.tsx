import { cn } from "@/lib/utils";

import { HTMLAttributes, ReactNode } from "react";

export interface H1Props extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
}

export default function H1({ children, className, ...props }: H1Props) {
  return (
    <h1 className={cn("text-3xl font-bold text-white", className)} {...props}>
      {children}
    </h1>
  );
}
