import { cn } from "@/lib/utils";
import React from "react";

const buttonVariants = {
  default: "bg-blue-500 text-white hover:bg-blue-600",
  outline: "border border-blue-500 text-blue-500 bg-white hover:bg-blue-50",
  destructive: "bg-red-500 text-white hover:bg-red-600",
};

const buttonSizes = {
  default: "px-4 py-2 text-base",
  sm: "px-2 py-1 text-sm",
  lg: "px-6 py-3 text-lg",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "destructive";
  size?: "default" | "sm" | "lg";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded transition-colors duration-200",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    />
  );
}