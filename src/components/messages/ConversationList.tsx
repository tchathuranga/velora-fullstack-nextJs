"use client";

import clsx from "clsx";

interface ConversationSummary {
  id: string;
  name: string;
  preview: string;
}

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="h-[32rem] overflow-y-auto border-r border-[var(--color-border)]">
      {conversations.length === 0 ? (
        <p className="p-4 text-sm text-[var(--color-muted)]">No conversations yet.</p>
      ) : (
        conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={clsx(
              "block w-full border-b border-[var(--color-border)] px-4 py-3 text-left transition",
              activeId === c.id ? "bg-[var(--color-primary-light)]" : "hover:bg-slate-50",
            )}
          >
            <p className={clsx("truncate text-sm font-medium", activeId === c.id ? "text-[var(--color-primary)]" : "text-slate-800")}>
              {c.name}
            </p>
            <p className="truncate text-xs text-[var(--color-muted)]">{c.preview}</p>
          </button>
        ))
      )}
    </div>
  );
}
