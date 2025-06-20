import * as React from "react";

type TabsProps = {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: React.ReactNode;
};

const TabsContext = React.createContext<{
  value: string;
  setValue: (value: string) => void;
} | null>(null);

export function Tabs({ defaultValue, value: controlledValue, onValueChange, className, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue || "");
  const isControlled = controlledValue !== undefined;
  const contextValue = {
    value: isControlled ? controlledValue! : value,
    setValue: (v: string) => {
      if (!isControlled) setValue(v);
      onValueChange?.(v);
    },
  };
  return (
    <TabsContext.Provider value={contextValue}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const active = ctx.value === value;
  return (
    <button
      type="button"
      className={`${className ?? ""} ${active ? "border-b-2 border-blue-500 font-bold" : ""}`}
      onClick={() => ctx.setValue(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = React.useContext(TabsContext);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div className={className}>{children}</div>;
}