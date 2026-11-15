import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/components/loginForm";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function mockFetch(status: number, body: object) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as jest.Mock;
}

async function fillAndSubmit(username: string, password: string) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText("Username"), username);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Log in" }));
}

beforeEach(() => {
  push.mockReset();
  render(<LoginForm />);
});

describe("Issue #1: Student login page", () => {
  it("shows username and password fields and a login button", () => {
    expect(screen.getByLabelText("Username")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("validates empty fields without calling the server", async () => {
    mockFetch(200, {});
    await fillAndSubmit("", "");
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter your username and password.");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows an error message when the credentials are wrong", async () => {
    mockFetch(401, { ok: false, error: "Incorrect username or password." });
    await fillAndSubmit("jalvarez", "WrongPassword1");
    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password.");
    expect(push).not.toHaveBeenCalled();
  });

  it("redirects to the dashboard after a successful login", async () => {
    mockFetch(200, { ok: true, redirectTo: "/dashboard" });
    await fillAndSubmit("jalvarez", "Password123!");
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", expect.objectContaining({ method: "POST" }));
    expect(push).toHaveBeenCalledWith("/dashboard");
  });
});
