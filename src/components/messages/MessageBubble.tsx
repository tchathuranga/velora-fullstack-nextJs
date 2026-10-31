import Link from "next/link";
import clsx from "clsx";
import { Package } from "lucide-react";
import { Message } from "@/types";

export function MessageBubble({ message, own, viewerRole }: { message: Message; own: boolean; viewerRole: "buyer" | "seller" }) {
  const time = new Date(message.timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const { product, order, images } = message;

  return (
    <div className={clsx("flex", own ? "justify-end" : "justify-start")}>
      <div className={clsx("max-w-[75%] rounded-2xl px-4 py-2 text-sm", own ? "bg-[var(--color-primary)] text-white" : "bg-slate-100 text-slate-800")}>
        {(product || order) && (
          <div className="mb-2 space-y-1.5">
            {product && (
              <Link
                href={`/product/${product.slug}`}
                className="flex items-center gap-2 rounded-lg bg-white p-2 text-slate-800 shadow-sm hover:bg-slate-50"
              >
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
                    <Package size={16} />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wide text-slate-400">Listing</span>
                  <span className="block truncate text-xs font-medium">{product.title}</span>
                </span>
              </Link>
            )}
            {order && (
              <Link
                href={viewerRole === "seller" ? `/seller/orders/${order.id}` : "/account"}
                className="block rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <span className="text-[10px] uppercase tracking-wide text-slate-400">Order</span> {order.id}
              </Link>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className={clsx("mb-1 grid gap-1.5", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
            {images.map((src) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="Shared photo" className="max-h-56 w-full rounded-lg object-cover" />
              </a>
            ))}
          </div>
        )}

        {message.text && <p className="whitespace-pre-wrap break-words">{message.text}</p>}
        <p className={clsx("mt-1 text-[10px]", own ? "text-white/70" : "text-slate-400")}>{time}</p>
      </div>
    </div>
  );
}
