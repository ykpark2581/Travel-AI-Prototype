"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { useExperimentStore } from "@/lib/store";

export function ChatPanel() {
  const messages = useExperimentStore((s) => s.messages);
  const isTyping = useExperimentStore((s) => s.isTyping);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isTyping]);

  // A message bubble now types itself out over several seconds (see
  // TypewriterText) instead of landing all at once, so it keeps growing
  // taller well after the effect above already scrolled for its arrival —
  // without this, a long reply's later lines would type in below the
  // visible viewport until the participant scrolled manually. ResizeObserver
  // catches every one of those in-place growth ticks; kept as a plain
  // (non-smooth) jump so it doesn't fight the smooth scroll above or judder
  // on every single character.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const observer = new ResizeObserver(() => {
      bottomRef.current?.scrollIntoView({ block: "end" });
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-3.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div>
          <p className="text-sm font-semibold leading-none">AI 여행 플래너</p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div ref={listRef} className="flex flex-col gap-4 p-4">
          <AnimatePresence initial={false}>
            {messages.map((message, index) => (
              <ChatMessage key={message.id} message={message} isFirst={index === 0} />
            ))}
            {isTyping && <TypingIndicator key="typing" />}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <ChatInput />
    </div>
  );
}
