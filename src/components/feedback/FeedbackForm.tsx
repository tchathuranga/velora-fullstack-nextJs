"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function FeedbackForm({
  productTitle,
  onSubmit,
}: {
  productTitle: string;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(rating, comment);
        setSubmitted(true);
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
      <Button type="submit" fullWidth>
        Submit feedback/review
      </Button>
    </form>
  );
}
