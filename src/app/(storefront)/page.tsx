"use client";

import { ImageBannerSlider } from "@/components/home/ImageBannerSlider";
import { TrustBadges } from "@/components/home/TrustBadges";
import { CategoryShowcase } from "@/components/home/CategoryShowcase";
import { ProductSection } from "@/components/home/ProductSection";
import { OnSaleSection } from "@/components/home/OnSaleSection";
import { RecentlyViewedSection } from "@/components/home/RecentlyViewedSection";
import { PageLoader } from "@/components/ui/PageLoader";
import { useGetProductsPageQuery } from "@/Redux/api";

const SECTION_SIZE = 12;

export default function HomePage() {
  // Each section asks the server for just its own few products; the home page never loads the whole catalog.
  const newest = useGetProductsPageQuery({ section: "new", limit: SECTION_SIZE });
  const deals = useGetProductsPageQuery({ section: "deal", limit: SECTION_SIZE });

  if (newest.isLoading || deals.isLoading) return <PageLoader />;

  return (
    <div className="container-page">
      <ImageBannerSlider />
      <TrustBadges />
      <CategoryShowcase />
      <RecentlyViewedSection />
      <ProductSection id="new-arrivals" title="New arrivals" products={newest.data?.items ?? []} />
      <ProductSection id="todays-deal" title="Today's deal" products={deals.data?.items ?? []} />
      <OnSaleSection id="on-sale" title="On sale" />
    </div>
  );
}
