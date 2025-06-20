import { cn } from "@/lib/utils";
import React from "react";

const badgeVariants = {
  default: "bg-blue-500 text-white",
  secondary: "bg-gray-200 text-gray-800",
  outline: "border border-gray-300 text-gray-700 bg-white",
  destructive: "bg-red-500 text-white",
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-1 text-xs font-semibold rounded",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}