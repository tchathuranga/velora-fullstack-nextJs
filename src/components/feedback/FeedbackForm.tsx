"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/Redux/api";

export function FeedbackForm({
  productTitle,
  onSubmit,
}: {
  productTitle: string;
  /** Rejects with a displayable error (see getErrorMessage) when the review can't be saved. */
  onSubmit: (rating: number, comment: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-medium text-slate-800">Thanks for your feedback!</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Your review helps other buyers.</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        try {
          await onSubmit(rating, comment);
          setSubmitted(true);
        } catch (err) {
          setError(getErrorMessage(err));
        } finally {
          setSubmitting(false);
        }
      }}
      className="space-y-4"
    >
      <p className="text-sm text-[var(--color-muted)]">{productTitle}</p>
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">
          Rate the product and service <span className="text-[var(--color-danger)]">*</span>
        </p>
        <StarRating value={rating} onChange={setRating} size={26} />
      </div>
      <Textarea
        label="Comment"
        placeholder="Write a comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      <Button type="submit" fullWidth disabled={submitting}>
        {submitting ? "Submitting…" : "Submit feedback/review"}
      </Button>
    </form>
  );
}
