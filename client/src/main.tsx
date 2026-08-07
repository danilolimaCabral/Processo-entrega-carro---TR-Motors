import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 10000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Helper: get auth token from localStorage or sessionStorage
const getAuthToken = (): string | null => {
  try {
    // Try localStorage first (more persistent, works in WebView)
    const lsToken = localStorage.getItem("trmotors_auth_token");
    if (lsToken) return lsToken;

    // Fallback to sessionStorage (session only)
    const raw = sessionStorage.getItem("manus-cookie");
    if (raw) {
      const prefix = `${COOKIE_NAME}=`;
      const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
      const token = pair?.trim().slice(prefix.length);
      if (token) {
        // Mirror to localStorage for persistence
        localStorage.setItem("trmotors_auth_token", token);
        return token;
      }
    }
  } catch {
    // Storage unavailable
  }
  return null;
};

// Helper: store auth token in both localStorage and sessionStorage
const storeAuthToken = (token: string) => {
  try {
    localStorage.setItem("trmotors_auth_token", token);
    sessionStorage.setItem("manus-cookie", `${COOKIE_NAME}=${token}`);
  } catch {
    // Storage unavailable
  }
};

// Helper: clear auth tokens
const clearAuthToken = () => {
  try {
    localStorage.removeItem("trmotors_auth_token");
    sessionStorage.removeItem("manus-cookie");
  } catch {
    // Storage unavailable
  }
};

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      headers() {
        // Mobile fallback: when the browser blocks cookies (Safari ITP /
        // private browsing / iOS-Android WebView like Instagram browser),
        // we forward the stored session token as a Bearer header.
        // The regular cookie flow keeps working and takes priority server-side.
        const token = getAuthToken();
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
        return {};
      },
      // Intercept responses to capture login token
      async fetch(input, init) {
        const response = await globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });

        // After successful login, extract token and store it
        try {
          const url = typeof input === "string" ? input : input.url;
          if (url.includes("auth.login") && response.ok) {
            const cloned = response.clone();
            const data = await cloned.json();
            const token = data?.result?.data?.json?.token;
            if (token) {
              storeAuthToken(token);
            }
          }
        } catch {
          // Ignore - not a login response or JSON parse failed
        }

        return response;
      },
    }),
  ],
});

// Expose clearAuthToken globally for useAuth logout
(window as any).__clearAuthToken = clearAuthToken;

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
