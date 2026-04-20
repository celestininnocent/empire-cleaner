import Image from "next/image";
import { siteConfig } from "@/config/site";

const DEFAULT_IMAGE_1 =
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_IMAGE_2 =
  "https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1200&q=80";

export function HomeHeroVisual() {
  const src1 = process.env.NEXT_PUBLIC_HOME_HERO_IMAGE_URL?.trim() || DEFAULT_IMAGE_1;
  const src2 = process.env.NEXT_PUBLIC_HOME_HERO_IMAGE_2_URL?.trim() || DEFAULT_IMAGE_2;

  return (
    <figure className="mx-auto mt-10 max-w-6xl sm:mt-12">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border/80 shadow-md">
          <Image
            src={src1}
            alt={siteConfig.homeHeroVisualAlt1}
            width={800}
            height={560}
            className="aspect-[4/3] w-full object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
          <p className="border-t border-border/60 bg-muted/30 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
            {siteConfig.homeHeroVisualLabel1}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-border/80 shadow-md">
          <Image
            src={src2}
            alt={siteConfig.homeHeroVisualAlt2}
            width={800}
            height={560}
            className="aspect-[4/3] w-full object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
          <p className="border-t border-border/60 bg-muted/30 px-3 py-2 text-center text-xs font-medium text-muted-foreground">
            {siteConfig.homeHeroVisualLabel2}
          </p>
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted-foreground">
        {siteConfig.homeHeroVisualCaption}
      </figcaption>
    </figure>
  );
}
