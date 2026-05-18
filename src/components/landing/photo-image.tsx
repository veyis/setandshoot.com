import Image, { type ImageProps } from "next/image";
import type { Photo } from "@/payload-types";

type Props = {
  photo: Pick<Photo, "url" | "sizes" | "width" | "height" | "alt">;
  sizes: string;
  className?: string;
  priority?: boolean;
} & Omit<ImageProps, "src" | "alt" | "sizes" | "className" | "priority">;

/** Renders a Payload Photo via next/image, preferring the `feed` variant for src. */
export function PhotoImage({ photo, sizes, className, priority, ...rest }: Props) {
  const src = photo.sizes?.feed?.url ?? photo.url ?? "";
  return (
    <Image
      src={src}
      alt={photo.alt ?? ""}
      width={photo.sizes?.feed?.width ?? photo.width ?? 1400}
      height={photo.sizes?.feed?.height ?? photo.height ?? 933}
      sizes={sizes}
      className={className}
      priority={priority}
      {...rest}
    />
  );
}
