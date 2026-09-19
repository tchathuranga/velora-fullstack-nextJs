import { Feedback } from "@/types";
import { StarRating } from "@/components/ui/StarRating";
import { formatDate } from "@/lib/utils";

export function FeedbackList({ feedback }: { feedback: Feedback[] }) {
  if (feedback.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">No feedback yet for this product.</p>;
  }

  return (
    <ul className="divide-y divide-[var(--color-border)]">
      {feedback.map((item) => (
        <li key={item.id} className="py-4 first:pt-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">{item.buyerName}</p>
            <span className="text-xs text-[var(--color-muted)]">{formatDate(item.createdAt)}</span>
          </div>
          <StarRating value={item.rating} readOnly size={14} className="mt-1" />
          <p className="mt-2 text-sm text-slate-600">{item.comment}</p>
        </li>
      ))}
    </ul>
  );
}
