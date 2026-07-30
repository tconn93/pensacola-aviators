import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

export type JsonArrayField = {
  key: string;
  label: string;
  type?: "text" | "textarea";
};

export function JsonArrayEditor({
  value,
  onChange,
  fields,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  fields: JsonArrayField[];
  label: string;
}) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  let items: Record<string, string>[] = [];
  try { items = JSON.parse(value); } catch { items = []; }
  if (!Array.isArray(items)) items = [];

  function startAdd() {
    const blank: Record<string, string> = {};
    fields.forEach((f) => { blank[f.key] = ""; });
    setEditForm(blank);
    setEditingIdx(items.length);
  }

  function startEdit(idx: number) {
    setEditForm({ ...items[idx] });
    setEditingIdx(idx);
  }

  function cancelEdit() {
    setEditingIdx(null);
    setEditForm({});
  }

  function saveEdit() {
    const updated = [...items];
    if (editingIdx !== null && editingIdx >= items.length) {
      // Adding new
      updated.push({ ...editForm });
    } else if (editingIdx !== null) {
      // Editing existing
      updated[editingIdx] = { ...editForm };
    }
    onChange(JSON.stringify(updated));
    setEditingIdx(null);
    setEditForm({});
  }

  function remove(idx: number) {
    const updated = items.filter((_, i) => i !== idx);
    onChange(JSON.stringify(updated));
  }

  const isEditing = editingIdx !== null;
  const isNew = isEditing && editingIdx !== null && editingIdx >= items.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {!isEditing && (
          <button type="button" className="btn btn-outline btn-sm" onClick={startAdd}>
            <Plus size={14} /> Add
          </button>
        )}
      </div>

      {items.map((item, idx) => (
        <div key={idx} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-3">
          {editingIdx === idx ? (
            <div className="space-y-2">
              {fields.map((f) => (
                <label key={f.key} className="block text-xs">
                  {f.label}
                  {f.type === "textarea" ? (
                    <textarea
                      className="field mt-0.5 text-xs"
                      rows={2}
                      value={editForm[f.key] ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    />
                  ) : (
                    <input
                      className="field mt-0.5 text-xs"
                      value={editForm[f.key] ?? ""}
                      onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                    />
                  )}
                </label>
              ))}
              <div className="flex gap-2 pt-1">
                <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                  <Check size={14} /> Save
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs space-y-0.5 min-w-0">
                {fields.map((f) => (
                  <div key={f.key} className="truncate">
                    <span className="text-[var(--color-subtle)]">{f.label}: </span>
                    {item[f.key] || <span className="italic text-[var(--color-muted)]">empty</span>}
                  </div>
                ))}
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" className="btn btn-ghost btn-sm p-1" onClick={() => startEdit(idx)} title="Edit">
                  <Pencil size={14} />
                </button>
                <button type="button" className="btn btn-ghost btn-sm p-1 text-[var(--color-primary)]" onClick={() => remove(idx)} title="Remove">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {isNew && (
        <div className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-elevated)] p-3">
          <div className="text-xs font-medium mb-2 text-[var(--color-primary)]">New item</div>
          <div className="space-y-2">
            {fields.map((f) => (
              <label key={f.key} className="block text-xs">
                {f.label}
                {f.type === "textarea" ? (
                  <textarea
                    className="field mt-0.5 text-xs"
                    rows={2}
                    value={editForm[f.key] ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                  />
                ) : (
                  <input
                    className="field mt-0.5 text-xs"
                    value={editForm[f.key] ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, [f.key]: e.target.value })}
                  />
                )}
              </label>
            ))}
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn btn-primary btn-sm" onClick={saveEdit}>
                <Check size={14} /> Add
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 && !isEditing && (
        <p className="text-xs text-[var(--color-muted)] italic">No items yet</p>
      )}
    </div>
  );
}
