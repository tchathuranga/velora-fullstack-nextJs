"use client";

import { useEffect, useState } from "react";
import { HeroBanners } from "@/components/home/HeroBanners";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ProductSection } from "@/components/home/ProductSection";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { PageLoader } from "@/components/ui/PageLoader";
import { getProductsByTag } from "@/lib/data/products";
import { fetchJson } from "@/lib/fetchJson";
import { Product } from "@/types";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJson<Product[]>("/data/products.json")
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="container-page">
      <HeroBanners />
      <RecentlyViewedSection products={products} />
      <ProductSection id="trending" title="Trending Ones" products={getProductsByTag(products, "trending", 12)} />
      <ProductSection id="new-arrivals" title="New arrivals" products={getProductsByTag(products, "new", 12)} />
      <PromoBanner />
      <ProductSection id="todays-deal" title="Today's deal" products={getProductsByTag(products, "deal", 12)} />
      <ProductSection id="on-sale" title="On sale" products={getProductsByTag(products, "sale", 12)} />
    </div>
  );
}
