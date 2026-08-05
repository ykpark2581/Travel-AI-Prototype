"use client";

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";

interface CardRegistryValue {
  register: (id: string, el: HTMLElement | null) => void;
  getElement: (id: string) => HTMLElement | null;
}

const CardRegistryContext = createContext<CardRegistryValue | null>(null);

export function CardRegistryProvider({ children }: { children: ReactNode }) {
  const map = useRef(new Map<string, HTMLElement>());

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) map.current.set(id, el);
    else map.current.delete(id);
  }, []);

  const getElement = useCallback((id: string) => map.current.get(id) ?? null, []);

  return <CardRegistryContext.Provider value={{ register, getElement }}>{children}</CardRegistryContext.Provider>;
}

export function useCardRegistry(): CardRegistryValue {
  const ctx = useContext(CardRegistryContext);
  if (!ctx) throw new Error("useCardRegistry must be used within CardRegistryProvider");
  return ctx;
}
