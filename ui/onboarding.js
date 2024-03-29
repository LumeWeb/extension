import { createRoot } from "react-dom";
import React from "react";
import App from "./apps/onboarding/App.tsx";
import * as Sentry from "@sentry/browser";
import { SENTRY_DSN } from "../shared/constants.ts";

Sentry.init({ dsn: SENTRY_DSN });

const root = createRoot(document.getElementById("app"));

root.render(React.createElement(App));
