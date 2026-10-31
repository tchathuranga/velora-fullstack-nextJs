import { OrderItem } from "@/types";
import { todayInColombo } from "@/lib/shipping";

/** True once the order line has both a courier and a tracking number. */
export const isShipped = (item: OrderItem) => Boolean(item.trackingNumber && item.courierName);

/**
 * The seller's ship-by deadline for an order line. Before the deadline it shows the date; once the date has passed
 * without shipping details it turns into an overdue warning; once shipped it disappears.
 */
export function ShipByIndicator({ item }: { item: OrderItem }) {
  if (isShipped(item) || !item.shipBy) return null;

  const overdue = todayInColombo() > item.shipBy;
  return (
    <div className="space-y-0.5 text-sm font-semibold text-[var(--color-danger)]">
      <p>Ship by: {item.shipBy}</p>
      {overdue && (
        <>
          <p>This order is overdue.</p>
          <p className="font-medium">Your order is overdue. Please ship it as soon as possible.</p>
        </>
      )}
    </div>
  );
}
