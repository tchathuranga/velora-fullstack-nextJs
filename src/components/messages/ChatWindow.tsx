"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Package, Send, X } from "lucide-react";
import { Message } from "@/types";
import { MessageBubble } from "@/components/messages/MessageBubble";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/Redux/api";
import { uploadImage } from "@/lib/upload";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTOS = 10;

interface Attachment {
  file: File;
  preview: string;
}

export interface OutgoingMessage {
  text: string;
  /** Hosted URLs of the photos, already uploaded. */
  images: string[];
}

export function ChatWindow({
  title,
  subtitle,
  messages,
  viewerRole,
  onSend,
  emptyHint,
  context,
  onContextSent,
}: {
  title: string;
  subtitle?: string;
  messages: Message[];
  viewerRole: "buyer" | "seller";
  /** May reject (the draft is kept and the error shown). */
  onSend: (message: OutgoingMessage) => void | Promise<void>;
  emptyHint?: string;
  /** A listing or order this message is about; shown above the input and attached to the next message. */
  context?: { label: string };
  onContextSent?: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const bottom = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Release the preview URLs when the chat goes away.
  const previews = useRef<string[]>([]);
  useEffect(() => {
    previews.current = attachments.map((a) => a.preview);
  }, [attachments]);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    setError("");
    const files = Array.from(list);
    const valid = files.filter((f) => ACCEPTED_TYPES.includes(f.type));
    if (valid.length < files.length) setError("Only JPG, JPEG, PNG and WebP photos can be sent.");
    setAttachments((prev) =>
      [...prev, ...valid.map((file) => ({ file, preview: URL.createObjectURL(file) }))].slice(0, MAX_PHOTOS),
    );
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && attachments.length === 0) || sending) return;
    setError("");
    setSending(true);
    try {
      const images = await Promise.all(attachments.map((a) => uploadImage(a.file, "message")));
      await onSend({ text, images });
      setDraft("");
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
      setAttachments([]);
      if (context) onContextSent?.();
    } catch (err) {
      setError(err instanceof Error && !("status" in err) ? err.message : getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[32rem] flex-col">
      <div className="border-b border-[var(--color-border)] px-5 py-3">
        <p className="font-semibold text-slate-900">{title}</p>
        {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <p className="pt-10 text-center text-sm text-[var(--color-muted)]">{emptyHint ?? "No messages yet."}</p>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} own={m.sender === viewerRole} viewerRole={viewerRole} />)
        )}
        <div ref={bottom} />
      </div>

      {error && <p className="px-5 pb-2 text-xs text-[var(--color-danger)]">{error}</p>}

      {context && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-lg bg-[var(--color-primary-light)] px-3 py-1.5 text-xs text-[var(--color-primary)]">
          <Package size={14} className="shrink-0" />
          <span className="min-w-0 flex-1 truncate">About: {context.label}</span>
          <button type="button" onClick={onContextSent} aria-label="Remove" className="shrink-0 hover:opacity-70">
            <X size={14} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 pb-2">
          {attachments.map((a, i) => (
            <div key={a.preview} className="relative h-16 w-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.preview} alt="Photo to send" className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                disabled={sending}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex gap-2 border-t border-[var(--color-border)] p-3">
        <input
          ref={fileInput}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Button type="button" variant="outline" size="md" aria-label="Attach photos" onClick={() => fileInput.current?.click()} disabled={sending}>
          <ImagePlus size={16} />
        </Button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={viewerRole === "buyer" ? "Message seller (Write a message)" : "Reply to buyer (Write a message)"}
          className="input-base"
        />
        <Button type="submit" size="md" aria-label="Send" disabled={sending}>
          <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
