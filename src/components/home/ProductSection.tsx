import { Product } from "@/types";
import { ProductGrid } from "@/components/product/ProductGrid";

export function ProductSection({
  id,
  title,
  products,
}: {
  id?: string;
  title: string;
  products: Product[];
}) {
  if (products.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-8">
      <div className="mb-4 flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <h2 className="section-title">{title}</h2>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
