"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TypewriterTextProps {
  /** Full text to reveal, one reveal-unit (see tokenize below) at a time. */
  text: string;
  /** Delay before revealing an ordinary character, in ms. */
  charDelayMs?: number;
  /** Extra pause held after a sentence-ending "." or "?", in ms. */
  sentencePauseMs?: number;
  /** Extra pause held after a line break (one or more consecutive "\n"), in ms. */
  lineBreakPauseMs?: number;
  /** Whether to show a blinking "|" cursor while text is still typing. */
  showCursor?: boolean;
  /** Called once, the moment the full text has been revealed. */
  onDone?: () => void;
  className?: string;
}

// Every regular character is its own reveal unit, but a run of consecutive
// "\n"s (a single line break, or a blank-line paragraph break) is kept
// together as ONE unit. Otherwise "\n\n" would trigger lineBreakPauseMs
// twice in a row — once per newline — turning one intended paragraph pause
// into two stacked ones.
function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === "\n") {
      let j = i + 1;
      while (text[j] === "\n") j++;
      tokens.push(text.slice(i, j));
      i = j;
    } else {
      tokens.push(text[i]);
      i += 1;
    }
  }
  return tokens;
}

// Renders `text` as if it were being typed out live, instead of appearing
// all at once — a long AI reply landing as one instant wall of text reads
// as more to absorb than the same text arriving gradually, and gives a
// participant a natural amount of time to read along as it appears. Pure
// hooks, no animation library: a single `shown` count of how many reveal
// units are visible, advanced one at a time via chained setTimeouts whose
// length depends on what was just revealed (sentence-ending punctuation and
// line breaks hold a beat longer than a plain character).
//
// Deliberately does NOT parse "**bold**" markup the way ChatMessage's
// renderMessageText does — no dialogue string uses it today (grepped for
// "**" across src/data and src/components/chat, nothing hits). If that
// changes, this'll need to route its revealed slice through the same
// bold-parsing so the asterisks themselves never render as literal
// characters mid-type.
export function TypewriterText({
  text,
  charDelayMs = 35,
  sentencePauseMs = 500,
  lineBreakPauseMs = 1400,
  showCursor = true,
  onDone,
  className,
}: TypewriterTextProps) {
  // Pure derivation from `text` — memoized rather than stashed in a ref, so
  // it's safe to read during render (React refs may only be read in
  // effects/handlers, never render itself).
  const tokens = useMemo(() => tokenize(text), [text]);

  // Resets the reveal whenever `text` itself changes (a genuinely different
  // message reusing this component instance, not just an unrelated
  // re-render). Done as a render-phase state adjustment — comparing against
  // the last-seen text and calling setState directly in the render body —
  // rather than `useEffect(() => setShown(0), [text])`; this is the
  // documented React pattern for "state derived from a changed prop" and
  // avoids that effect's extra commit-then-effect-then-recommit round trip.
  const [prevText, setPrevText] = useState(text);
  const [shown, setShown] = useState(0);
  if (text !== prevText) {
    setPrevText(text);
    setShown(0);
  }

  // onDone is passed inline by callers (a new function identity every
  // render) — read through a ref so the typing effect below doesn't need it
  // as a dependency and re-fire mid-type whenever the caller re-renders. The
  // ref itself is only ever written inside an effect, never during render.
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (shown >= tokens.length) {
      if (tokens.length > 0) onDoneRef.current?.();
      return;
    }
    const justRevealed = tokens[shown - 1];
    const delay = justRevealed?.startsWith("\n")
      ? lineBreakPauseMs
      : justRevealed === "." || justRevealed === "?"
        ? sentencePauseMs
        : charDelayMs;

    const timer = setTimeout(() => setShown((n) => n + 1), delay);
    return () => clearTimeout(timer);
  }, [shown, tokens, charDelayMs, sentencePauseMs, lineBreakPauseMs]);

  const visible = tokens.slice(0, shown).join("");
  const isTyping = shown < tokens.length;

  return (
    <span className={cn("whitespace-pre-line", className)}>
      {visible}
      {showCursor && isTyping && (
        <span aria-hidden className="animate-[typewriter-blink_1s_step-end_infinite]">
          |
        </span>
      )}
    </span>
  );
}
