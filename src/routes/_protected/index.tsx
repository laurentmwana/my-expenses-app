import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/")({
  component: Page,
});

function Page() {
  return <div>Hello "/_protected/"!</div>;
}
