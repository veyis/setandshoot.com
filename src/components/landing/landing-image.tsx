import Image from "next/image";
import type { ResolvedLandingPhoto } from "@/lib/landing/photos";

type Props = {
  photo: ResolvedLandingPhoto;
  sizes: string;
  className?: string;
  priority?: boolean;
  objectPosition?: string;
};

/** Renders a landing JPEG with intrinsic dimensions; use `size-full object-cover` in a sized parent. */
export function LandingImage({ photo, sizes, className, priority, objectPosition }: Props) {
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes={sizes}
      className={className}
      priority={priority}
      style={{ objectPosition: objectPosition ?? photo.objectPosition }}
    />
  );
}
