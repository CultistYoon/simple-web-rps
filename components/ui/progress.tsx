import React from "react";

export function Progress({
  value,
  max = 100,
  className,
}: {
  value: number;
  max?: number;
  className?: string;
}) {
  return (
    <progress
      className={className}
      value={value}
      max={max}
      style={{ width: "100%", height: "1rem" }}
    >
      {value}%
    </progress>
  );
}