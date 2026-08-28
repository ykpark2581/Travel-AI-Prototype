"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useExperimentStore } from "@/lib/store";
import { companionConfirmLabel, styleTagLabel } from "@/data/dialogue";
import type { StyleQuestionPayload, TravelStyleTag } from "@/types";

// Every condition's second upfront question, asked right after the
// companion question confirms (see data/dialogue.ts's styleQuestion,
// lib/store.ts's postStyleQuestion/confirmStyleQuestion) — replacing the
// old companion-implied style guess. Used to be AI-led only; now asked of
// every condition, though only AI-led's ranking actually uses the answer
// (see confirmStyleQuestion's own comment). Multi-select, capped at 2 (see
// MAX_TAGS) — unlike components/chat/CompanionQuestionMessage.tsx's
// single-select, tapping an already-picked tag again deselects it, and once
// 2 are picked, tapping a third does nothing until one is freed up first.
// Confirming echoes the pick as a real user-role chat bubble (see
// confirmStyleQuestion) rather than a pill here, so this renders nothing
// once confirmed — just hides its own chips/button, same as
// CompanionQuestionMessage.
const MAX_TAGS = 2;

export function StyleQuestionMessage({ payload }: { payload: StyleQuestionPayload }) {
  const confirmStyleQuestion = useExperimentStore((s) => s.confirmStyleQuestion);
  const [selected, setSelected] = useState<TravelStyleTag[]>(payload.selected);

  if (payload.confirmed) {
    return null;
  }

  const toggle = (tag: TravelStyleTag) => {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {payload.options.map((tag) => {
          const isSelected = selected.includes(tag);
          const atCap = !isSelected && selected.length >= MAX_TAGS;
          return (
            <button
              key={tag}
              type="button"
              disabled={atCap}
              onClick={() => toggle(tag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : atCap
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-muted-foreground hover:bg-muted"
              )}
            >
              {styleTagLabel(tag)}
            </button>
          );
        })}
      </div>
      <Button size="sm" disabled={selected.length === 0} onClick={() => confirmStyleQuestion(selected)}>
        {companionConfirmLabel}
      </Button>
    </div>
  );
}
