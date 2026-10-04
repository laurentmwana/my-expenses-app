import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/privacy")({
  component: Page,
});

function Page() {
  return <div>Hello "/privacy"!</div>;
}
