Here is a design-system guide for crafting production-ready, accessible React components in this project using **Next.js**, **Tailwind CSS v4**, **CVA (class-variance-authority)**, and **shadcn primitives**.

---

### Component Construction Standards

**1. Type Safety & Prop Extension**

* Always extend native HTML element attributes (e.g., `ButtonHTMLAttributes<HTMLButtonElement>`, `HTMLAttributes<HTMLDivElement>`) to guarantee standard attributes (`id`, `aria-*`, `onClick`, `tabIndex`) pass through seamlessly.
* Combine native props with CVA's `VariantProps<typeof yourVariants>`:
```tsx
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

```



**2. Class Merging & CVA Architecture**

* Define styles through `cva()` with explicit `variants` and `defaultVariants`.
* Always wrap the final output in `cn(variants({ ... }), className)` from `@/lib/utils` to allow granular override from consumer components.
* Use Tailwind v4 semantic CSS variable tokens (e.g., `bg-primary`, `text-foreground`, `border-border`, `font-serif`) instead of hardcoded hex values (`#212121`).

**3. State, Loading & Micro-Interactions**

* **Loading states**: Disable button interactions (`disabled={isLoading || disabled}`) and display an accessible loading indicator without shifting layouts.
* **Micro-interactions**: Use subtle active and hover states (e.g., `active:scale-[0.98] transition-all duration-200`).
* **Disabled styling**: Include `disabled:pointer-events-none disabled:opacity-50`.

**4. Slot & Polymorphism (`asChild`)**

* When a button or card acts as a Next.js link (`<Link href="...">`), support the Radix `Slot` pattern using `asChild` to avoid invalid nested interactive tags (`<button><a>...</a></button>`):
```tsx
import { Slot } from "@radix-ui/react-slot";

const Comp = asChild ? Slot : "button";
return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;

```



---

### Reference Implementation: The Luxury Aesthetic Button

Here is how the earlier example evolves into the current project's theme (Gold / Luxury Aesthetic / Tailwind v4 tokens):

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 font-sans font-medium text-sm tracking-wide transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-gold text-white border border-gold hover:bg-gold-hover hover:border-gold-hover shadow-sm",
        secondary:
          "bg-transparent text-foreground border border-border hover:border-foreground hover:bg-foreground hover:text-background",
        outline:
          "bg-card text-foreground border border-border hover:border-gold hover:text-gold shadow-sm",
        ghost:
          "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted",
        dark:
          "bg-foreground text-background hover:bg-gold hover:text-white",
      },
      size: {
        sm: "h-9 px-4 text-xs rounded-md",
        default: "h-12 px-6 text-sm rounded-md",
        lg: "h-14 px-8 text-base rounded-lg",
        icon: "h-10 w-10 p-0 rounded-md shrink-0",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      icon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";
    const isEffectivelyDisabled = disabled || loading;

    return (
      <Comp
        ref={ref}
        disabled={isEffectivelyDisabled}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current" />
            <span>{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="inline-flex shrink-0">{icon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";
export default Button;

```

---

### Reference Implementation: Typographic Heading (`Heading.tsx`)

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const headingVariants = cva("font-serif text-foreground tracking-tight font-normal", {
  variants: {
    level: {
      h1: "text-4xl md:text-5xl lg:text-6xl leading-[1.1]",
      h2: "text-3xl md:text-4xl leading-snug",
      h3: "text-2xl md:text-3xl leading-snug",
      h4: "text-xl md:text-2xl",
    },
  },
  defaultVariants: {
    level: "h1",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function Heading({
  as,
  level = "h1",
  className,
  children,
  ...props
}: HeadingProps) {
  const Component = as || level || "h1";

  return (
    <Component
      className={cn(headingVariants({ level }), className)}
      {...props}
    >
      {children}
    </Component>
  );
}

```

---

### Checklist Before Merging Any Component

1. **`cn()` included**: Does the outer wrapper use `cn(...)` allowing class overrides?
2. **Accessible by default**: Do interactive elements include focus rings (`focus-visible:ring-2`) and valid ARIA attributes?
3. **Semantic tokens only**: Are all backgrounds, text, and borders mapped to project CSS variables (`bg-card`, `text-muted-foreground`) rather than arbitrary hex strings?
4. **`asChild` verified**: Can the component render as a Next.js `<Link>` without React console nesting warnings?
5. **No inline styles**: Are layout and positioning handled exclusively via Tailwind classes?