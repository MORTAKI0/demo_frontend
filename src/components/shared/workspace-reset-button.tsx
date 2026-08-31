"use client";

import { Button } from "@/components/ui/button";

export function WorkspaceResetButton({
  onReset,
}: {
  onReset: () => void;
}) {
  function reset() {
    onReset();
    window.location.reload();
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={reset}
      title="Restore the seeded workspace state"
    >
      Reset workspace
    </Button>
  );
}
