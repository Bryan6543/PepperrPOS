import { Suspense } from "react";
import UnlockForm from "./UnlockForm";

export default function UnlockPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-pepperr-cream text-sm text-pepperr-muted">
          Loading…
        </div>
      }
    >
      <UnlockForm />
    </Suspense>
  );
}
