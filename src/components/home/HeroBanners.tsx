import Link from "next/link";
import { Flame, Sparkles, Tag, PercentCircle } from "lucide-react";

const banners = [
  {
    href: "#trending",
    title: "Trending picks",
    subtitle: "See what everyone's buying right now",
    icon: Flame,
    className: "from-indigo-600 to-violet-600",
  },
  {
    href: "#new-arrivals",
    title: "New arrivals",
    subtitle: "Fresh finds added this week",
    icon: Sparkles,
    className: "from-sky-600 to-cyan-600",
  },
  {
    href: "#todays-deal",
    title: "Today's deal",
    subtitle: "Limited-time offers, refreshed daily",
    icon: Tag,
    className: "from-orange-500 to-rose-500",
  },
  {
    href: "#on-sale",
    title: "On sale",
    subtitle: "Save more on selected items",
    icon: PercentCircle,
    className: "from-emerald-600 to-teal-600",
  },
];

export function HeroBanners() {
  return (
    <section className="grid grid-cols-1 gap-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
      {banners.map((banner) => {
        const Icon = banner.icon;
        return (
          <Link
            key={banner.title}
            href={banner.href}
            className={`relative flex min-h-40 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-sm transition hover:shadow-md ${banner.className}`}
          >
            <Icon size={28} className="opacity-90" />
            <div>
              <p className="text-lg font-semibold">{banner.title}</p>
              <p className="text-sm text-white/80">{banner.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </section>
  );
}
