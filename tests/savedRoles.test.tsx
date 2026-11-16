import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SavedRoles from "@/components/savedRoles";
import type { CareerRole, SavedRole } from "@/types/roadmap";

const roles: CareerRole[] = [
  { id: "data-analyst", title: "Data Analyst", field: "Data", medianPay: 83640, requiredDegree: "Bachelor's" },
  { id: "ux-designer", title: "UX Designer", field: "Design", medianPay: 92750, requiredDegree: "Bachelor's" },
];
const term = `Fall ${new Date().getFullYear() + 1}`;
const saved: SavedRole = { roleId: "data-analyst", roleTitle: "Data Analyst", targetTerm: term, note: "", createdAt: "", updatedAt: "" };

function mockFetch(status: number, body: object) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as jest.Mock;
}

describe("Issue #3: SavedRoles component", () => {
  it("shows field errors and does not call the server when the form is empty", async () => {
    mockFetch(201, {});
    render(<SavedRoles roles={roles} initialSavedRoles={[]} />);
    await userEvent.click(screen.getByRole("button", { name: "Save role" }));
    expect(screen.getByText("Choose a career role.")).toBeInTheDocument();
    expect(screen.getByText("Choose the term you want to qualify by.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("adds the saved role to the list after the server accepts it", async () => {
    mockFetch(201, { ok: true, savedRole: saved });
    render(<SavedRoles roles={roles} initialSavedRoles={[]} />);
    await userEvent.selectOptions(screen.getByLabelText("Career role"), "data-analyst");
    await userEvent.selectOptions(screen.getByLabelText("Qualify by"), term);
    await userEvent.click(screen.getByRole("button", { name: "Save role" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Saved Data Analyst.");
    expect(screen.getByRole("list", { name: "Saved target roles" })).toHaveTextContent(`Qualify by ${term}`);
  });

  it("shows the server's error when saving fails", async () => {
    mockFetch(409, { ok: false, error: "You already saved Data Analyst." });
    render(<SavedRoles roles={roles} initialSavedRoles={[]} />);
    await userEvent.selectOptions(screen.getByLabelText("Career role"), "data-analyst");
    await userEvent.selectOptions(screen.getByLabelText("Qualify by"), term);
    await userEvent.click(screen.getByRole("button", { name: "Save role" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("You already saved Data Analyst.");
  });

  it("hides roles the student already saved from the picker", () => {
    render(<SavedRoles roles={roles} initialSavedRoles={[saved]} />);
    const options = Array.from((screen.getByLabelText("Career role") as HTMLSelectElement).options).map((o) => o.value);
    expect(options).toEqual(["", "ux-designer"]);
  });
});
