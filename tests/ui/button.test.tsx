import "./dom-setup";
import "./setup";
import { describe, expect, it, mock } from "bun:test";
import { Button } from "@/components/ui/button";

const { render, screen } =
  require("@testing-library/react") as typeof import("@testing-library/react");
const userEvent = require("@testing-library/user-event")
  .default as typeof import("@testing-library/user-event").default;

describe("Button Component", () => {
  it("renders correctly with text", () => {
    // ARRANGE & ACT
    render(<Button>Click Me</Button>);

    // ASSERT
    const button = screen.getByRole("button", { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it("fires onClick callback when clicked", async () => {
    // ARRANGE
    const user = userEvent.setup();
    const handleClick = mock();
    render(<Button onClick={handleClick}>Submit</Button>);

    const button = screen.getByRole("button", { name: /submit/i });

    // ACT
    await user.click(button);

    // ASSERT
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    // ARRANGE
    const user = userEvent.setup();
    const handleClick = mock();
    render(
      <Button onClick={handleClick} disabled>
        Submit
      </Button>,
    );

    const button = screen.getByRole("button", { name: /submit/i });

    // ACT
    await user.click(button);

    // ASSERT
    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});
