"use client";

import { useEffect, useMemo, useRef } from "react";
import { useGetOnSaleProductsInfiniteQuery } from "@/Redux/api";
import { ProductGrid } from "@/components/product/ProductGrid";

/** Every product on sale, fetched from the server a page at a time as the shopper scrolls down. */
export function OnSaleSection({ id, title }: { id?: string; title: string }) {
  const { data, fetchNextPage, hasNextPage, isFetching } = useGetOnSaleProductsInfiniteQuery();
  const products = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !hasNextPage || isFetching) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, fetchNextPage, products.length]);

  if (products.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-8">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <h2 className="section-title">{title}</h2>
      </div>
      <ProductGrid products={products} />
      {hasNextPage && <div ref={sentinel} className="h-10" aria-hidden />}
    </section>
  );
}
