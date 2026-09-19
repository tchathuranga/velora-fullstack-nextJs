import { Badge } from "@/components/ui/Badge";
import { SellerStatus } from "@/types";
import { statusLabel } from "@/lib/utils";

const toneMap: Record<SellerStatus, "success" | "danger" | "warning" | "neutral"> = {
  active: "success",
  rejected: "danger",
  limited: "danger",
  under_review: "warning",
};

export function StatusBadge({ status }: { status: SellerStatus }) {
  return <Badge tone={toneMap[status]}>{statusLabel(status)}</Badge>;
}
