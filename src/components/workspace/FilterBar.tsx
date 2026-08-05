"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function FilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  search,
  onSearchChange,
  placeholder,
}: {
  categories: string[];
  activeCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onCategoryChange(null)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            activeCategory === null
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onCategoryChange(category)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              activeCategory === category
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
