import React, { useState } from "react";

export function Tabs({
  tabs,
  className,
}: {
  tabs: { label: string; content: React.ReactNode }[];
  className?: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <div className={className}>
      <div className="flex border-b">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            className={`px-4 py-2 ${
              i === active ? "border-b-2 border-blue-500 font-bold" : ""
            }`}
            onClick={() => setActive(i)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">{tabs[active].content}</div>
    </div>
  );
}