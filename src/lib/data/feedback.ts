import { Feedback } from "@/types";

export function getFeedbackForProduct(feedback: Feedback[], productId: string): Feedback[] {
  return feedback.filter((f) => f.productId === productId);
}
