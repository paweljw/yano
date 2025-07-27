"use client";

import { createContext, useContext, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { createRootStore, type RootStore } from "./task.store";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "~/server/api/root";
import SuperJSON from "superjson";

const StoreContext = createContext<RootStore | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<RootStore | undefined>(undefined);
  
  const trpcClient = useMemo(() => createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: `${typeof window !== "undefined" ? window.location.origin : ""}/api/trpc`,
        headers: () => {
          const headers = new Headers();
          headers.set("x-trpc-source", "client");
          return headers;
        },
        transformer: SuperJSON,
      }),
    ],
  }), []);

  if (!storeRef.current) {
    storeRef.current = createRootStore();
    storeRef.current.setApi(trpcClient);
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
