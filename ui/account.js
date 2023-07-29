import { createRoot } from "react-dom";
import React from "react";

import App from "./apps/account/App.tsx";

const root = createRoot(document.getElementById("app"));

root.render(React.createElement(App));
