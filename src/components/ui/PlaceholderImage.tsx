import {
  Shirt,
  Headphones,
  Smartphone,
  Watch,
  Coffee,
  Lamp,
  Backpack,
  Sparkles,
  Palette,
  Dumbbell,
  Footprints,
  Camera,
  Baby,
  Gamepad2,
  ShoppingBag,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";
import clsx from "clsx";

const ICONS: Record<string, LucideIcon> = {
  Shirt,
  Headphones,
  Smartphone,
  Watch,
  Coffee,
  Lamp,
  Backpack,
  Sparkles,
  Palette,
  Dumbbell,
  Footprints,
  Camera,
  Baby,
  Gamepad2,
  ShoppingBag,
};

const GRADIENTS = [
  "from-indigo-100 to-indigo-200 text-indigo-500",
  "from-sky-100 to-sky-200 text-sky-500",
  "from-emerald-100 to-emerald-200 text-emerald-500",
  "from-rose-100 to-rose-200 text-rose-500",
  "from-amber-100 to-amber-200 text-amber-600",
  "from-fuchsia-100 to-fuchsia-200 text-fuchsia-500",
  "from-cyan-100 to-cyan-200 text-cyan-500",
  "from-violet-100 to-violet-200 text-violet-500",
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

interface PlaceholderImageProps {
  seed: string;
  icon?: string;
  label?: string;
  className?: string;
  iconClassName?: string;
}

export function PlaceholderImage({
  seed,
  icon,
  label,
  className,
  iconClassName,
}: PlaceholderImageProps) {
  const hash = hashSeed(seed);
  const gradient = GRADIENTS[hash % GRADIENTS.length];
  const Icon = (icon && ICONS[icon]) || ImageIcon;

  return (
    <div
      role="img"
      aria-label={label ?? "Product image placeholder"}
      className={clsx(
        "flex items-center justify-center bg-gradient-to-br",
        gradient,
        className,
      )}
    >
      <Icon className={clsx("h-1/3 w-1/3", iconClassName)} strokeWidth={1.5} />
    </div>
  );
}
