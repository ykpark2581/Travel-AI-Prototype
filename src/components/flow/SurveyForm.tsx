"use client";

import { Textarea } from "@/components/ui/textarea";
import { likertScaleLabels, likertScaleSize } from "@/data/questionnaire";
import { cn } from "@/lib/utils";
import type { QuestionnaireItem } from "@/types";

// Shared Likert/text renderer for both the per-condition survey and the
// final survey — same visual language, different item sets and submission
// targets (see ConditionSurveyScreen / QuestionnaireScreen).
export function SurveyForm({
  items,
  answers,
  onAnswerChange,
}: {
  items: QuestionnaireItem[];
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-7">
      {items.map((item, idx) => (
        <div key={item.id}>
          <p className="text-sm font-medium">
            {idx + 1}. {item.question}
          </p>
          {item.type === "likert" ? (
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="w-16 shrink-0 text-[11px] text-muted-foreground">{likertScaleLabels[0]}</span>
              <div className="flex flex-1 justify-center gap-2">
                {Array.from({ length: likertScaleSize }, (_, i) => i + 1).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => onAnswerChange(item.id, String(value))}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                      answers[item.id] === String(value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <span className="w-16 shrink-0 text-right text-[11px] text-muted-foreground">{likertScaleLabels[1]}</span>
            </div>
          ) : (
            <Textarea
              value={answers[item.id] ?? ""}
              onChange={(e) => onAnswerChange(item.id, e.target.value)}
              rows={3}
              className="mt-3 resize-none"
              placeholder="자유롭게 작성해 주세요"
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Every item (likert or text) must be answered before submitting — the
// final survey in particular is text-only, so treating text as optional
// would let it submit blank.
export function allRequiredAnswered(items: QuestionnaireItem[], answers: Record<string, string>): boolean {
  return items.every((item) => answers[item.id]?.trim());
}
