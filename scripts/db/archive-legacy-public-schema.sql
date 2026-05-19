-- Archive pre-Payload tables in the `public` schema (legacy belin-photos app).
-- Payload CMS uses the `payload` schema exclusively — nothing in the app reads these tables.
--
-- Run only after confirming you no longer need the 21 legacy photo rows for reference.
-- Take a branch snapshot in Neon Console before executing.
--
-- Verified 2026-05-18: public.photos (21 rows), empty junction tables, no app references.

BEGIN;

DROP TABLE IF EXISTS public.photo_tag;
DROP TABLE IF EXISTS public.photo_category;
DROP TABLE IF EXISTS public.album_photo;
DROP TABLE IF EXISTS public.photos;
DROP TABLE IF EXISTS public.albums;
DROP TABLE IF EXISTS public.categories;
DROP TABLE IF EXISTS public.tags;
DROP TABLE IF EXISTS public.settings;

COMMIT;
