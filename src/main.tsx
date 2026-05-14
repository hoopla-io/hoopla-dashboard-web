import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "@/app/globals.css";

import { Providers } from "@/components/providers/providers";
import { ErrorBoundary } from "@/components/error-boundary";
import { router } from "@/router";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Providers>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </Providers>
  </React.StrictMode>
);
