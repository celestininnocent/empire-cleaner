import Image from "next/image";
import { siteConfig } from "@/config/site";

/** Default stock image — override with NEXT_PUBLIC_HOME_HERO_IMAGE_URL in production if you use your own photo. */
const DEFAULT_HERO_IMAGE =
  "https://images.unsplash.com/photo-1584622650111-993a426cbf47?auto=format&fit=crop&w=1600&q=80";

export function HomeHeroVisual() {
  const src = process.env.NEXT_PUBLIC_HOME_HERO_IMAGE_URL?.trim() || DEFAULT_HERO_IMAGE;

  return (
    <figure className="mx-auto mt-10 max-w-6xl overflow-hidden rounded-2xl border border-border/80 shadow-lg sm:mt-12">
      <Image
        src={src}
        alt={siteConfig.homeHeroVisualAlt}
        width={1600}
        height={640}
        className="aspect-[21/10] w-full object-cover sm:aspect-[21/9] sm:max-h-[min(380px,40vh)]"
        sizes="(max-width: 768px) 100vw, 1152px"
        priority
      />
      <figcaption className="border-t border-border/60 bg-muted/30 px-4 py-2.5 text-center text-xs text-muted-foreground">
        {siteConfig.homeHeroVisualCaption}
      </figcaption>
    </figure>
  );
}
