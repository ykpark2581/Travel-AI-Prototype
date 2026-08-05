"use client";

import { ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Sending happens on the dedicated prompt page before this view mounts;
// this stays visible (disabled) so the chat interface still reads as a real chat panel.
export function ChatInput() {
  return (
    <div className="flex items-end gap-2 border-t bg-background p-3">
      <Textarea
        value=""
        readOnly
        placeholder="지금은 아래 화면에서 진행해 주세요"
        rows={1}
        disabled
        className="max-h-32 min-h-[44px] resize-none"
      />
      <Button size="icon" disabled className="shrink-0 rounded-full">
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
}
