import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium disabled:pointer-events-none disabled:opacity-50 group relative",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        secondary: "bg-secondary text-secondary-foreground",
        ghost: "",
        link: "underline",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1",
        lg: "px-8 py-4",
        icon: "w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

const RetroIndicator = ({ color = "white", blink = false }: { color?: string; blink?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="51"
    viewBox="0 0 16 51"
    fill="none"
    className={cn(
      "absolute left-0 transition-opacity duration-200 pointer-events-none",
      blink ? "opacity-100 animate-pulse" : "opacity-0 group-hover:opacity-100"
    )}
    style={{ marginLeft: '-24px' }}
  >
    <g style={{ mixBlendMode: 'difference' }}>
      <path
        d="M7.57096 10.8418C7.71692 11.4132 7.78976 12.1275 7.78976 12.9847C7.78975 13.8061 7.71692 14.5204 7.57096 15.1275H10.3077C10.4537 15.6989 10.5265 16.4132 10.5265 17.2704C10.5265 18.0918 10.4537 18.8061 10.3077 19.4132H13.0445C13.1904 19.9847 13.2633 20.6989 13.2633 21.5561C13.2633 22.3775 13.1904 23.0918 13.0445 23.6989H15.7812C15.9272 24.2704 16 24.9847 16 25.8418C16 26.6632 15.9272 27.3775 15.7812 27.9847H13.0445C13.1904 28.5561 13.2633 29.2704 13.2633 30.1275C13.2633 30.9489 13.1904 31.6632 13.0445 32.2704H10.3077C10.4537 32.8418 10.5265 33.5561 10.5265 34.4132C10.5265 35.2347 10.4537 35.9489 10.3077 36.5561H7.57096C7.71692 37.1275 7.78976 37.8418 7.78976 38.6989C7.78976 39.5204 7.71692 40.2347 7.57096 40.8418H1.00276C0.996946 40.8176 0.991954 40.7931 0.98637 40.7686C0.432805 40.021 0 33.6235 0 25.8418C0 18.064 0.431775 11.6686 0.984944 10.9157C0.990899 10.8909 0.996542 10.8661 1.00276 10.8418H7.57096Z"
        fill={color}
      />
    </g>
  </svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  indicatorColor?: string;
  hideIndicator?: boolean;
  indicatorBlink?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, indicatorColor = "white", hideIndicator = false, indicatorBlink = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
        {!hideIndicator && <RetroIndicator color={indicatorColor} blink={indicatorBlink} />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
