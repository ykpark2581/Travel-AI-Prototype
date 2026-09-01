"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { conditionTypeDescriptions, likertScaleLabels, likertScaleSize } from "@/data/questionnaire";
import { cn } from "@/lib/utils";
import type { QuestionnaireItem, QuestionnaireLikertItem } from "@/types";

// Circled digits — for the fs1 description list below only.
const CIRCLED_DIGITS = ["①", "②", "③", "④", "⑤"];

// The 1-7 button row. Endpoint labels sit in a side column next to the
// buttons (not below the row — tried that, read worse) — sized to fit
// their own text (`w-fit whitespace-nowrap`, not a fixed px width) so
// "전혀 그렇지 않다" never wraps/clips, with the buttons themselves a
// notch smaller (h-8 w-8, not h-9 w-9) so the whole row still comfortably
// fits the card width alongside two full-width labels.
function LikertRow({
  item,
  answers,
  onAnswerChange,
}: {
  item: QuestionnaireLikertItem;
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="w-fit shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
        {likertScaleLabels[0]}
      </span>
      <div className="flex flex-1 justify-center gap-1.5">
        {Array.from({ length: likertScaleSize }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onAnswerChange(item.id, String(value))}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-medium transition-colors",
              answers[item.id] === String(value)
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="w-fit shrink-0 whitespace-nowrap text-right text-[11px] text-muted-foreground">
        {likertScaleLabels[1]}
      </span>
    </div>
  );
}

// One question's own markup — shared by every survey (conditionSurveyItems,
// finalSurveyItems, preSurveyItems).
function QuestionBlock({
  item,
  number,
  answers,
  onAnswerChange,
  expandedDescriptions,
  setExpandedDescriptions,
}: {
  item: QuestionnaireItem;
  number: number;
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
  expandedDescriptions: Set<string>;
  setExpandedDescriptions: (updater: (prev: Set<string>) => Set<string>) => void;
}) {
  return (
    <div>
      <p className="text-sm font-medium">
        {number}. {item.question}
      </p>
      {/* item.description — see types/index.ts's own comment for what this
          is for. Not to be confused with conditionTypeDescriptions/
          expandedDescriptions below, which is a per-OPTION disclosure
          toggle specific to fs1, not a per-question field. */}
      {item.description && <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>}
      {item.type === "likert" ? (
        <div className="mt-3">
          <LikertRow item={item} answers={answers} onAnswerChange={onAnswerChange} />
        </div>
      ) : item.type === "choice" ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onAnswerChange(item.id, option)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  answers[item.id] === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {/* Only shows up when at least one option actually has a
              description on file (see conditionTypeDescriptions) —
              a future choice question with no matching entries just
              never renders this toggle at all. */}
          {item.options.some((o) => conditionTypeDescriptions[o]) && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() =>
                  setExpandedDescriptions((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.id)) next.delete(item.id);
                    else next.add(item.id);
                    return next;
                  })
                }
                className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", expandedDescriptions.has(item.id) && "rotate-180")}
                />
                {expandedDescriptions.has(item.id) ? "유형 설명 접기" : "각 유형 설명 보기"}
              </button>
              {expandedDescriptions.has(item.id) && (
                <ul className="mt-2 space-y-1.5 rounded-lg bg-muted/50 p-3">
                  {item.options.map(
                    (option, i) =>
                      conditionTypeDescriptions[option] && (
                        <li key={option} className="flex gap-1.5 text-xs leading-relaxed text-muted-foreground">
                          <span className="shrink-0 font-medium text-foreground">
                            {CIRCLED_DIGITS[i] ?? `${i + 1}.`} {option}:
                          </span>
                          <span>{conditionTypeDescriptions[option]}</span>
                        </li>
                      )
                  )}
                </ul>
              )}
            </div>
          )}
          {/* Pilot-only so far — see item.followUp's own comment
              (types/index.ts). Reads as part of THIS question, not a
              separately numbered one, so it renders right inside the same
              block rather than as its own QuestionBlock. */}
          {item.followUp && answers[item.id] === item.followUp.option && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground">{item.followUp.question}</p>
              <Textarea
                value={answers[item.followUp.id] ?? ""}
                onChange={(e) => onAnswerChange(item.followUp!.id, e.target.value)}
                rows={2}
                className="mt-1.5 resize-none"
                placeholder="선택적 자유서술"
              />
            </div>
          )}
        </>
      ) : item.type === "shortText" ? (
        <Input
          value={answers[item.id] ?? ""}
          onChange={(e) => onAnswerChange(item.id, e.target.value)}
          className="mt-3"
          placeholder={item.placeholder}
        />
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
  );
}

// Shared Likert/text/choice renderer for both the per-condition survey and
// the final survey — same visual language, different item sets and
// submission targets (see ConditionSurveyScreen / QuestionnaireScreen).
export function SurveyForm({
  items,
  answers,
  onAnswerChange,
  groups,
  notes,
}: {
  items: QuestionnaireItem[];
  answers: Record<string, string>;
  onAnswerChange: (id: string, value: string) => void;
  // Optional visual dividers spanning multiple questions — e.g.
  // PreSurveyScreen.tsx's "평소 여행 계획 방식" / "AI 사용 경험 및 인식" /
  // "기본 정보" groupings. `startId` names the FIRST item the group's
  // heading should appear directly above; question numbering itself stays
  // one continuous sequence across the whole form (1..N) — these are pure
  // visual section breaks, not separate numbering scopes. Omit entirely
  // for a form with no such grouping (conditionSurveyItems/
  // finalSurveyItems don't use this).
  groups?: { label: string; startId: string }[];
  // Small unnumbered captions that sit BETWEEN two items — not inside one
  // question's own block the way `item.description` is (see
  // QuestionBlock above), so use this for something that isn't really
  // about the single question it's anchored to. Unlike `groups` above this
  // isn't a section heading — no bold text, no border, no id/answer of its
  // own, just a muted line. `beforeId` places it above that item's whole
  // block (question + answer control); `afterId` places it below — e.g.
  // rewardSurveyNotes' phone-number usage/retention policy line, which
  // reads better once the number's already been typed than stacked above
  // an empty input. Exactly one of the two should be set per entry.
  notes?: (({ beforeId: string; afterId?: undefined } | { beforeId?: undefined; afterId: string }) & {
    text: string;
  })[];
}) {
  // Per-item, not global — only ever meaningful for a choice item whose
  // options have matching conditionTypeDescriptions entries (currently
  // just fs1), but keeping the toggle state keyed by item.id here rather
  // than hardcoding fs1 keeps this component generic for any future choice
  // question that wants the same disclosure pattern.
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

  return (
    <div className="space-y-7">
      {items.map((item, idx) => {
        const group = groups?.find((g) => g.startId === item.id);
        const noteBefore = notes?.find((n) => n.beforeId === item.id);
        const noteAfter = notes?.find((n) => n.afterId === item.id);
        return (
          <div key={item.id}>
            {group && (
              <div className={cn(idx > 0 && "mb-6 mt-8 border-t pt-6", "mb-3")}>
                <h2 className="text-base font-semibold">{group.label}</h2>
              </div>
            )}
            {noteBefore && <p className="mb-2 text-xs text-muted-foreground">{noteBefore.text}</p>}
            <QuestionBlock
              item={item}
              number={idx + 1}
              answers={answers}
              onAnswerChange={onAnswerChange}
              expandedDescriptions={expandedDescriptions}
              setExpandedDescriptions={setExpandedDescriptions}
            />
            {noteAfter && <p className="mt-2 text-xs text-muted-foreground">{noteAfter.text}</p>}
          </div>
        );
      })}
    </div>
  );
}

// Every item (likert, text, or choice) must be answered before submitting
// — several of the final survey's items aren't Likert, so treating those
// as optional would let them submit blank. Two exceptions, both pilot-only
// so far: a text item marked `optional` (see QuestionnaireTextItem) never
// blocks submission regardless of its value; a choice item's `followUp`
// (see QuestionnaireChoiceItem) only blocks submission when it's actually
// showing (its trigger option was picked) AND it isn't itself marked
// optional.
export function allRequiredAnswered(items: QuestionnaireItem[], answers: Record<string, string>): boolean {
  return items.every((item) => {
    const isOptionalText = item.type === "text" && item.optional;
    if (!isOptionalText && !answers[item.id]?.trim()) return false;

    if (item.type === "choice" && item.followUp) {
      const followUpShowing = answers[item.id] === item.followUp.option;
      if (followUpShowing && !item.followUp.optional && !answers[item.followUp.id]?.trim()) return false;
    }

    return true;
  });
}
