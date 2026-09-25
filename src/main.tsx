import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App";
import { AuthProvider } from "./components/auth/AuthProvider";
import { ConsentGate } from "./components/auth/ConsentGate";

const convexUrl: unknown = import.meta.env.VITE_CONVEX_URL;
if (typeof convexUrl !== "string" || convexUrl.length === 0) {
  throw new Error(
    "VITE_CONVEX_URL ausente. Execute `bun convex dev --once` para provisionar o Convex local.",
  );
}

const convex = new ConvexReactClient(convexUrl);

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Elemento #root não encontrado no index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <AuthProvider client={convex}>
        <ConsentGate>
          <App />
        </ConsentGate>
      </AuthProvider>
    </ConvexProvider>
  </StrictMode>,
);
