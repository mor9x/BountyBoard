import { EveFrontierProvider } from "@evefrontier/dapp-kit";
import { useEffect } from "react";
import { RouterProvider, type DataRouter } from "react-router-dom";
import { queryClient } from "../lib/query-client";

type AppProvidersProps = {
  router: DataRouter;
};

export function AppProviders({ router }: AppProvidersProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("eve-dapp-connected");
    }
  }, []);

  return (
    <EveFrontierProvider queryClient={queryClient}>
      <RouterProvider router={router} />
    </EveFrontierProvider>
  );
}
