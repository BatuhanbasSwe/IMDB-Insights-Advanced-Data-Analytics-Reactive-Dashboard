import { render, screen } from "@testing-library/react";
import App from "./App";

// This is a minimal smoke test; the dashboard loads data asynchronously.
test("renders dashboard title", () => {
  render(<App />);
  // Initial render shows loading state before the async fetch resolves.
  expect(screen.getByText(/Loading dashboard/i)).toBeInTheDocument();
});
