import Image, { type ImageProps } from "next/image";
import type { Photo } from "@/payload-types";
import { photoAlt, photoDimensions, photoSrc } from "@/lib/payload/media";

type Props = {
  photo: Pick<Photo, "url" | "sizes" | "width" | "height" | "alt" | "filename">;
  sizes: string;
  className?: string;
  priority?: boolean;
} & Omit<ImageProps, "src" | "alt" | "sizes" | "className" | "priority" | "width" | "height">;

/** Renders a Payload Photo via next/image, preferring static /media/ paths. */
export function PhotoImage({ photo, sizes, className, priority, ...rest }: Props) {
  const src = photoSrc(photo as Photo, "feed");
  if (!src) return null;
  const { width, height } = photoDimensions(photo as Photo, "feed");

  return (
    <Image
      src={src}
      alt={photoAlt(photo as Photo)}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      {...rest}
    />
  );
}
