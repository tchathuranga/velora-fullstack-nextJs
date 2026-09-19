import clsx from "clsx";
import { Message } from "@/types";

export function MessageBubble({ message, own }: { message: Message; own: boolean }) {
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className={clsx("flex", own ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[75%] rounded-2xl px-4 py-2 text-sm", own ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-800")}>
        <p>{message.text}</p>
        <p className={clsx("mt-1 text-[10px]", own ? "text-white/70" : "text-slate-400")}>{time}</p>
      </div>
    </div>
  );
}
