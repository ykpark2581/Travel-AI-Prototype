"use client";

import { ChatPanel } from "@/components/chat/ChatPanel";
import { BrowserWorkspace } from "@/components/workspace/BrowserWorkspace";
import { ConditionCompleteDialog } from "@/components/flow/ConditionCompleteDialog";

// Workspace (left) and chat (right) both render unconditionally, for every
// condition and every stage — including flights/hotels search and AI-led's
// activities/restaurants (see BrowserWorkspace's AiWorkingPanel fallback
// for what the workspace shows when there's no interactive catalog for
// this particular stage/condition). Condition differences belong entirely
// to *what* the exploration process looks like, never to whether either
// column exists at all. No top progress/stepper bar — the explore →
// itinerary progression is just two stages and reads clearly enough from
// the chat + workspace content alone.
export function PrototypeShell() {
  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-muted/30">
      {/* Never stacked, down to tablet width — participants need to see
          both at once. What shrinks instead is the chat column's width
          and, inside the workspace, the card grid (which responds to its
          own column width via container queries — see ExplorePanel —
          rather than the viewport, since that column is narrower than the
          viewport whenever chat sits next to it). */}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col p-3">
          <BrowserWorkspace />
        </div>
        <div className="flex min-w-[280px] w-full max-w-[480px] flex-col border-l bg-background lg:w-[30%]">
          <ChatPanel />
        </div>
      </div>
      <ConditionCompleteDialog />
    </div>
  );
}
