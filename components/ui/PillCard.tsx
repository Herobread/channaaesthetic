import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { HTMLAttributes, ReactNode } from "react";

export const pillCardVariants = cva("overflow-hidden bg-[#212121] p-5", {
  variants: {
    rounding: {
      "all-rounded": "rounded-3xl",
      "flat-bottom": "rounded-t-3xl rounded-b-md",
      "flat-top": "rounded-b-3xl rounded-t-md",
    },
  },
  defaultVariants: {
    rounding: "all-rounded",
  },
});

export interface PillCardProps
  extends
    HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof pillCardVariants> {
  children: ReactNode;
}

export default function PillCard({
  children,
  className,
  rounding,
  ...props
}: PillCardProps) {
  return (
    <div className={cn(pillCardVariants({ rounding }), className)} {...props}>
      {children}
    </div>
  );
}
