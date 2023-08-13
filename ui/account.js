import { createRoot } from "react-dom";
import React from "react";
import * as Sentry from "@sentry/browser";
import App from "./apps/account/App.tsx";
import { SENTRY_DSN } from "../shared/constants.ts";

Sentry.init({ dsn: SENTRY_DSN });

const root = createRoot(document.getElementById("app"));

root.render(React.createElement(App));
