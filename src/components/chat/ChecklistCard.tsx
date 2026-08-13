"use client";

import { Loader2, Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChecklistPayload } from "@/types";

// A checklist ("hotely.com 사이트 탐색 중" etc.) is a distinct "AI is
// processing" beat, not a normal reply — rendered as its own standalone
// card in the chat timeline (see components/chat/ChatMessage.tsx's early
// return for messages with a checklist payload), never nested inside the
// usual rounded message bubble. No avatar, no bubble background — just a
// plain status card so it visually reads as "work happening," distinct
// from something the AI "said."
export function ChecklistCard({ payload }: { payload: ChecklistPayload }) {
  const done = payload.revealedCount >= payload.items.length;
  // Only ever render items whose turn has actually come — a not-yet-reached
  // item has no DOM presence at all (not just dimmed text), so the card
  // visibly grows one line at a time as `revealedCount` advances (see
  // lib/store.ts's runChecklist), matching "AI가 실제로 다음 단계로
  // 진행하는 것처럼" one step becoming visible after another, not the whole
  // list appearing together and just changing color.
  const completedItems = payload.items.slice(0, payload.revealedCount);
  const currentItem = done ? null : payload.items[payload.revealedCount];

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[80%] space-y-2 rounded-xl border border-dashed bg-muted/40 px-4 py-3">
        {completedItems.map((item) => {
          // Any line that's actually a "done" beat (ends in "완료" — "~검색
          // 완료", "항공편 선택 완료", "숙소 선택 완료", etc.) keeps the
          // primary-colored check badge + gets bolded — every other
          // completed line (the "~탐색 중" / "~최적화 중" steps along the
          // way) gets a plain muted dot instead, so the lines that actually
          // matter read as the payoff, not just "another item ticked off
          // the same way."
          const isComplete = item.endsWith("완료");
          return (
            <div
              key={item}
              className={cn(
                "flex items-center gap-2 text-sm text-foreground transition-colors",
                isComplete && "font-bold"
              )}
            >
              {isComplete ? (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground">
                  <Check className="h-2.5 w-2.5" />
                </span>
              ) : (
                <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <Circle className="h-2 w-2 fill-muted-foreground text-muted-foreground" />
                </span>
              )}
              {item}
            </div>
          );
        })}
        {currentItem && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            {currentItem}
          </div>
        )}
      </div>
    </div>
  );
}
