import { RichText } from "@payloadcms/richtext-lexical/react";
import type { Story } from "@/payload-types";
import { PayloadPhoto } from "@/components/story/payload-photo";
import { resolvePhoto } from "@/lib/payload/media";

type StoryBlocksProps = {
  blocks: NonNullable<Story["layout"]>;
};

export function StoryBlocks({ blocks }: StoryBlocksProps) {
  if (!blocks?.length) return null;

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      {blocks.map((block, index) => {
        const key = block.id ?? `${block.blockType}-${index}`;

        switch (block.blockType) {
          case "fullBleedPhoto": {
            const photo = resolvePhoto(block.photo);
            if (!photo) return null;
            return (
              <figure key={key} className="-mx-6 md:-mx-12">
                <PayloadPhoto photo={photo} size="full" className="h-auto w-full object-cover" />
              </figure>
            );
          }

          case "diptych": {
            const left = resolvePhoto(block.photoLeft);
            const right = resolvePhoto(block.photoRight);
            const ratio = block.ratio === "60-40" ? "md:grid-cols-[3fr_2fr]" : "md:grid-cols-2";
            return (
              <figure key={key} className={`grid grid-cols-1 gap-2 ${ratio}`}>
                {left ? (
                  <PayloadPhoto photo={left} size="feed" className="h-auto w-full object-cover" />
                ) : null}
                {right ? (
                  <PayloadPhoto photo={right} size="feed" className="h-auto w-full object-cover" />
                ) : null}
              </figure>
            );
          }

          case "triptych": {
            const photos = (block.photos ?? [])
              .map((p) => resolvePhoto(p))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            return (
              <figure key={key} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {photos.map((photo) => (
                  <PayloadPhoto
                    key={photo.id}
                    photo={photo}
                    size="feed"
                    className="aspect-[3/4] w-full object-cover"
                  />
                ))}
              </figure>
            );
          }

          case "insetPortrait": {
            const photo = resolvePhoto(block.photo);
            return (
              <section
                key={key}
                className="grid grid-cols-1 items-start gap-8 md:grid-cols-[minmax(0,320px)_1fr]"
              >
                {photo ? (
                  <PayloadPhoto
                    photo={photo}
                    size="feed"
                    className="aspect-[3/4] w-full max-w-sm object-cover"
                  />
                ) : null}
                {block.text ? (
                  <div className="prose prose-sm text-ink max-w-prose">
                    <RichText data={block.text as never} />
                  </div>
                ) : null}
              </section>
            );
          }

          case "sequence": {
            const photos = (block.photos ?? [])
              .map((p) => resolvePhoto(p))
              .filter((p): p is NonNullable<typeof p> => Boolean(p));
            return (
              <figure key={key} className="flex flex-col gap-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {photos.map((photo) => (
                    <PayloadPhoto
                      key={photo.id}
                      photo={photo}
                      size="feed"
                      className="h-64 w-auto max-w-none shrink-0 object-cover"
                    />
                  ))}
                </div>
                {block.caption ? (
                  <figcaption className="text-ink-muted text-sm">{block.caption}</figcaption>
                ) : null}
              </figure>
            );
          }

          case "pullQuote":
            return (
              <blockquote
                key={key}
                className="border-accent font-display border-l-2 py-2 pl-6 text-3xl leading-snug tracking-tight md:text-4xl"
              >
                <p>{block.quote}</p>
                {block.attribution ? (
                  <footer className="text-ink-muted mt-4 font-sans text-sm">
                    {block.attribution}
                  </footer>
                ) : null}
              </blockquote>
            );

          case "textParagraph":
            return block.text ? (
              <div key={key} className="prose prose-sm text-ink max-w-prose">
                <RichText data={block.text as never} />
              </div>
            ) : null;

          default:
            return null;
        }
      })}
    </div>
  );
}
