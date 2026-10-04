"use client";

import { ImageBannerSlider } from "@/components/home/ImageBannerSlider";
import { HeroBanners } from "@/components/home/HeroBanners";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { PromoBanner } from "@/components/home/PromoBanner";
import { ProductSection } from "@/components/home/ProductSection";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { PageLoader } from "@/components/ui/PageLoader";
import { getProductsByTag } from "@/lib/data/products";
import { useProducts } from "@/context/ProductsContext";

export default function HomePage() {
  const { products, loading } = useProducts();

  if (loading) return <PageLoader />;

  return (
    <div className="container-page">
      <ImageBannerSlider />
      <HeroBanners />
      <CategoryShowcase />
      <RecentlyViewedSection products={products} />
      <ProductSection id="trending" title="Trending Ones" products={getProductsByTag(products, "trending", 12)} />
      <ProductSection id="new-arrivals" title="New arrivals" products={getProductsByTag(products, "new", 12)} />
      <ProductSection id="todays-deal" title="Today's deal" products={getProductsByTag(products, "deal", 12)} />
      <ProductSection id="on-sale" title="On sale" products={getProductsByTag(products, "sale", 12)} />
    </div>
  );
}
       