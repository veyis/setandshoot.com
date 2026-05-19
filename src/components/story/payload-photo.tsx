import Image from "next/image";
import type { Photo } from "@/payload-types";
import {
  photoAlt,
  photoDimensions,
  photoSrc,
  resolvePhoto,
  type PhotoSize,
} from "@/lib/payload/media";

type PayloadPhotoProps = {
  photo: Photo | number | null | undefined;
  size?: PhotoSize;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function PayloadPhoto({
  photo: photoRef,
  size = "feed",
  className,
  priority,
  sizes = "(max-width: 768px) 100vw, 1200px",
}: PayloadPhotoProps) {
  const photo = resolvePhoto(photoRef);
  const src = photoSrc(photo, size);
  if (!src || !photo) return null;

  const { width, height } = photoDimensions(photo, size);

  return (
    <Image
      src={src}
      alt={photoAlt(photo)}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  );
}
