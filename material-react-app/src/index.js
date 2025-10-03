// material-react-app/src/index.js

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// 1. A linha "import { AuthContextProvider } from "context";" foi REMOVIDA.

// Material Dashboard 2 React Context Provider
import { MaterialUIControllerProvider } from "context";

const rootElement = document.getElementById("root");
const root = createRoot(rootElement);

root.render(
  <BrowserRouter>
    {/* 2. O <AuthContextProvider> foi REMOVIDO daqui. */}
    <MaterialUIControllerProvider>
      <App />
    </MaterialUIControllerProvider>
  </BrowserRouter>
);