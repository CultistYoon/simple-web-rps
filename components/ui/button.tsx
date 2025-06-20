import { cn } from "@/lib/utils";
import React from "react";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn("px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600", className)} {...props} />;
}