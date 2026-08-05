"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, RotateCw } from "lucide-react";

export function AddressBar({ url, loading }: { url: string; loading: boolean }) {
  const [typed, setTyped] = useState(url);

  useEffect(() => {
    if (!url) return;
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTyped(url.slice(0, i));
      if (i >= url.length) clearInterval(interval);
    }, 12);
    return () => clearInterval(interval);
  }, [url]);

  return (
    <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground/50">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" />
        <span className="truncate font-mono">
          {typed || "about:blank"}
          {loading && <span className="animate-pulse">|</span>}
        </span>
      </div>
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <RotateCw className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
      )}
    </div>
  );
}
