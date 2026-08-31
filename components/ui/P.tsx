import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, ReactNode } from "react";

export const pVariants = cva("text-[#e3e3e3]", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    },
    weight: {
      normal: "font-normal",
      bold: "font-bold",
    },
    colour: {
      default: "text-white",
      secondary: "text-[#e3e3e3]",
      muted: "text-[#808080]",
      danger: "text-[#ff6b6b]",
    },
  },
  defaultVariants: {
    size: "md",
    colour: "secondary",
  },
});

export interface PProps
  extends HTMLAttributes<HTMLParagraphElement>, VariantProps<typeof pVariants> {
  children: ReactNode;
}

export default function P({
  children,
  className,
  size,
  weight,
  colour,
  ...props
}: PProps) {
  return (
    <p
      className={cn(pVariants({ size, colour, weight }), className)}
      {...props}
    >
      {children}
    </p>
  );
}
