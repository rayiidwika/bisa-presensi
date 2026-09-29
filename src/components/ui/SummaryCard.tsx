"use client";

interface SummaryCardProps {
  items: {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    accent?: "blue" | "emerald" | "amber" | "violet";
  }[];
}

const ACCENTS = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    value: "text-blue-800",
    border: "border-blue-100",
    icon: "bg-blue-100 text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    value: "text-emerald-800",
    border: "border-emerald-100",
    icon: "bg-emerald-100 text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    value: "text-amber-800",
    border: "border-amber-100",
    icon: "bg-amber-100 text-amber-600",
  },
  violet: {
    bg: "bg-violet-50",
    text: "text-violet-700",
    value: "text-violet-800",
    border: "border-violet-100",
    icon: "bg-violet-100 text-violet-600",
  },
};

export default function SummaryCard({ items }: SummaryCardProps) {
  return (
    <div
      className={`grid gap-3 ${
        items.length === 2 ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {items.map((item, i) => {
        const accent = ACCENTS[item.accent ?? "blue"];
        return (
          <div
            key={i}
            className={`${accent.bg} border ${accent.border} rounded-2xl p-4 flex flex-col gap-2 shadow-sm`}
          >
            {item.icon && (
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent.icon}`}
              >
                {item.icon}
              </div>
            )}
            <div>
              <p className={`text-[10px] font-semibold uppercase tracking-wider ${accent.text} opacity-70`}>
                {item.label}
              </p>
              <p className={`text-2xl font-bold ${accent.value} leading-tight mt-0.5`}>
                {item.value}
                {item.unit && (
                  <span className="text-sm font-medium ml-1 opacity-70">
                    {item.unit}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
