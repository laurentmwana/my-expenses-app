import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/cgv")({
  component: Page,
});

function Page() {
  return <div>Hello "/legal/cgv"!</div>;
}
