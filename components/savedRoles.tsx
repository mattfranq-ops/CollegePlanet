"use client";

import { useState, type FormEvent } from "react";
import { upcomingTerms, validateSaveRoleInput, validateUpdateSavedRoleInput, type FieldErrors } from "@/lib/roadmapValidation";
import { NOTE_MAX_LENGTH, type CareerRole, type SavedRole } from "@/types/roadmap";

interface Props {
  roles: CareerRole[];
  initialSavedRoles: SavedRole[];
  /** Set when the dashboard could not load data from Firestore. */
  loadError?: string;
}

type ApiResult = { ok: boolean; error?: string; fieldErrors?: FieldErrors; savedRole?: SavedRole };

async function send(url: string, method: string, body?: unknown): Promise<ApiResult> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = (await res.json()) as ApiResult;
    return res.ok ? data : { ...data, ok: false, error: data.error ?? "Something went wrong. Try again." };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

/** User story #3: save target roles so the student can come back to them. */
export default function SavedRoles({ roles, initialSavedRoles, loadError }: Props) {
  const terms = upcomingTerms();
  const [savedRoles, setSavedRoles] = useState(initialSavedRoles);
  const [roleId, setRoleId] = useState("");
  const [targetTerm, setTargetTerm] = useState("");
  const [note, setNote] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const savedIds = new Set(savedRoles.map((r) => r.roleId));
  const available = roles.filter((r) => !savedIds.has(r.id));

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    const checked = validateSaveRoleInput({ roleId, targetTerm, note });
    if (!checked.ok) {
      setFieldErrors(checked.errors);
      setError(null);
      return;
    }
    setBusy(true);
    const result = await send("/api/saved-roles", "POST", checked.value);
    setBusy(false);
    if (!result.ok || !result.savedRole) {
      setFieldErrors(result.fieldErrors ?? {});
      setError(result.error ?? "Could not save the role.");
      return;
    }
    setSavedRoles((list) => [...list, result.savedRole!]);
    setRoleId("");
    setTargetTerm("");
    setNote("");
    setFieldErrors({});
    setError(null);
    setStatus(`Saved ${result.savedRole.roleTitle}.`);
  }

  async function handleUpdate(saved: SavedRole, changes: { targetTerm: string; note: string }) {
    setStatus(null);
    const checked = validateUpdateSavedRoleInput(changes);
    if (!checked.ok) {
      setError(Object.values(checked.errors)[0] ?? "Check the fields.");
      return false;
    }
    setBusy(true);
    const result = await send(`/api/saved-roles/${encodeURIComponent(saved.roleId)}`, "PATCH", checked.value);
    setBusy(false);
    if (!result.ok || !result.savedRole) {
      setError(result.fieldErrors ? Object.values(result.fieldErrors)[0]! : result.error ?? "Could not update the role.");
      return false;
    }
    setSavedRoles((list) => list.map((r) => (r.roleId === saved.roleId ? result.savedRole! : r)));
    setError(null);
    setEditing(null);
    setStatus(`Updated ${saved.roleTitle}.`);
    return true;
  }

  async function handleRemove(saved: SavedRole) {
    setStatus(null);
    setBusy(true);
    const result = await send(`/api/saved-roles/${encodeURIComponent(saved.roleId)}`, "DELETE");
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Could not remove the role.");
      return;
    }
    setSavedRoles((list) => list.filter((r) => r.roleId !== saved.roleId));
    setError(null);
    setStatus(`Removed ${saved.roleTitle}.`);
  }

  return (
    <section className="card saved-roles" aria-labelledby="saved-roles-heading">
      <h2 id="saved-roles-heading">Your target roles</h2>
      <p className="muted">Save the careers you are aiming for and the term you want to qualify by. They stay here every time you log in.</p>

      {error && <p className="form-error" role="alert">{error}</p>}
      {status && <p className="form-status" role="status">{status}</p>}

      {savedRoles.length === 0 ? (
        <p className="empty">You haven&apos;t saved a target role yet.</p>
      ) : (
        <ul className="saved-list" aria-label="Saved target roles">
          {savedRoles.map((saved) =>
            editing === saved.roleId ? (
              <EditRow key={saved.roleId} saved={saved} terms={terms} busy={busy} onCancel={() => setEditing(null)} onSave={handleUpdate} />
            ) : (
              <li key={saved.roleId} className="saved-item">
                <div>
                  <strong>{saved.roleTitle}</strong>
                  <span className="term">Qualify by {saved.targetTerm}</span>
                  {saved.note && <p className="note">{saved.note}</p>}
                </div>
                <div className="actions">
                  <button type="button" className="secondary" disabled={busy} onClick={() => setEditing(saved.roleId)} aria-label={`Edit ${saved.roleTitle}`}>
                    Edit
                  </button>
                  <button type="button" className="secondary" disabled={busy} onClick={() => handleRemove(saved)} aria-label={`Remove ${saved.roleTitle}`}>
                    Remove
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <form className="saved-form" onSubmit={handleSave} noValidate aria-label="Save a target role">
        <h3>Save a target role</h3>

        <label htmlFor="roleId">Career role</label>
        <select id="roleId" value={roleId} onChange={(e) => setRoleId(e.target.value)} aria-invalid={Boolean(fieldErrors.roleId)}>
          <option value="">Choose a role…</option>
          {available.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        {fieldErrors.roleId && <p className="field-error">{fieldErrors.roleId}</p>}

        <label htmlFor="targetTerm">Qualify by</label>
        <select id="targetTerm" value={targetTerm} onChange={(e) => setTargetTerm(e.target.value)} aria-invalid={Boolean(fieldErrors.targetTerm)}>
          <option value="">Choose a term…</option>
          {terms.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {fieldErrors.targetTerm && <p className="field-error">{fieldErrors.targetTerm}</p>}

        <label htmlFor="note">Note (optional)</label>
        <textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} aria-invalid={Boolean(fieldErrors.note)} />
        <span className="counter">{note.trim().length}/{NOTE_MAX_LENGTH}</span>
        {fieldErrors.note && <p className="field-error">{fieldErrors.note}</p>}

        <button type="submit" disabled={busy}>{busy ? "Saving…" : "Save role"}</button>
      </form>
    </section>
  );
}

function EditRow({
  saved,
  terms,
  busy,
  onCancel,
  onSave,
}: {
  saved: SavedRole;
  terms: string[];
  busy: boolean;
  onCancel: () => void;
  onSave: (saved: SavedRole, changes: { targetTerm: string; note: string }) => Promise<boolean>;
}) {
  const [targetTerm, setTargetTerm] = useState(saved.targetTerm);
  const [note, setNote] = useState(saved.note);
  const options = terms.includes(saved.targetTerm) ? terms : [saved.targetTerm, ...terms];
  const termId = `term-${saved.roleId}`;
  const noteId = `note-${saved.roleId}`;

  return (
    <li className="saved-item editing">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSave(saved, { targetTerm, note });
        }}
        aria-label={`Edit ${saved.roleTitle}`}
      >
        <strong>{saved.roleTitle}</strong>
        <label htmlFor={termId}>Qualify by</label>
        <select id={termId} value={targetTerm} onChange={(e) => setTargetTerm(e.target.value)}>
          {options.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <label htmlFor={noteId}>Note</label>
        <textarea id={noteId} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
        <div className="actions">
          <button type="submit" disabled={busy}>Save changes</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </li>
  );
}
