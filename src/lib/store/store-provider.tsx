"use client";

import { createContext, useContext, useRef } from "react";
import type { ReactNode } from "react";
import { createRootStore, type RootStore } from "./task.store";
import { api } from "~/trpc/react";

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RootStore>();

  if (!storeRef.current) {
    storeRef.current = createRootStore();
    storeRef.current.setApi(api);
  }

  return (
    <StoreContext.Provider value={storeRef.current}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
}

export function useTaskStore() {
  const store = useStore();
  return store.taskStore;
}
