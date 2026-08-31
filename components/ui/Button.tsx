import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React, { ButtonHTMLAttributes } from "react";

// Icon Color mapping for SVG icons
const iconColors = {
  fancy: "#000000",
  secondary: "#FFFFFF",
  tertiary: "#FFFFFF",
  ghost: "#FFFFFF",
  danger: "#FF6B6B",
} as const;

export const buttonVariants = cva(
  "relative flex flex-row items-center justify-center gap-2 overflow-hidden font-bold transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        fancy: "bg-[#707070] text-black",
        secondary: "bg-[#212121] text-white hover:bg-[#323232]",
        tertiary: "bg-[#323232] text-white hover:bg-zinc-700",
        danger: "bg-[#2f2222] text-[#ff6b6b]",
        ghost: "bg-transparent text-white hover:bg-white/10",
      },
      size: {
        default: "h-12 px-5 text-base",
        lg: "h-[72px] px-6 text-lg rounded-3xl w-full",
        icon: "h-12 w-12 rounded-full p-0",
      },
      rounding: {
        "all-rounded": "rounded-3xl",
        "flat-bottom": "rounded-t-3xl rounded-b-md",
        "flat-top": "rounded-b-3xl rounded-t-md",
        "full-flat": "rounded-md",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "secondary",
      rounding: "all-rounded",
    },
  },
);

export interface ButtonProps
  extends
    ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  content?: string;
  loading?: boolean;
  pending?: boolean; // Kept for backward compatibility with form actions
  icon?: React.ComponentType<{
    color?: string;
    size?: number;
    className?: string;
  }>;
  withArrow?: boolean;
}

export function Button({
  content,
  children,
  icon: Icon,
  variant = "fancy",
  size,
  rounding,
  loading,
  pending,
  className,
  disabled,
  withArrow,
  ...props
}: ButtonProps) {
  const isLoading = loading || pending;
  const isEffectivelyDisabled = isLoading || disabled;
  const isFancy = variant === "fancy";
  const iconColor =
    iconColors[(variant as keyof typeof iconColors) || "secondary"];

  return (
    <button
      disabled={isEffectivelyDisabled}
      className={cn(
        buttonVariants({
          variant,
          size,
          rounding,
        }),
        className,
      )}
      {...props}
    >
      {/* Fancy Background Gradient */}
      {isFancy && !disabled && (
        <span
          className="absolute inset-0 z-0 bg-linear-to-r from-[#BDCEFF] via-white to-[#FFF2C0] pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Loading Overlay / Spinner */}
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] z-10">
          <svg
            className="animate-spin h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      {/* Icon */}
      {Icon && (
        <span className="z-1 flex items-center">
          <Icon color={iconColor} size={20} />
        </span>
      )}

      {/* Button Text */}
      {(content || children) && (
        <span className={cn("z-1", withArrow ? "flex-1 text-left" : "")}>
          {content || children}
        </span>
      )}

      {/* Chevron Right Arrow */}
      {withArrow && (
        <svg
          className="z-1 shrink-0"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={iconColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      )}
    </button>
  );
}

export default Button;
