import { initSentry } from "./lib/sentry";
import { initPostHog } from "./lib/posthog";

// Init monitoring before anything else
initSentry();
initPostHog();

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { useAuth } from "./hooks/use-auth";

setAuthTokenGetter(() => useAuth.getState().token);

createRoot(document.getElementById("root")!).render(<App />);
