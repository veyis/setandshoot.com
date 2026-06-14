import * as migration_20260518_163754_stories_collections from './20260518_163754_stories_collections';
import * as migration_20260518_185513_bookings from './20260518_185513_bookings';
import * as migration_20260612_120000_content_indexes from './20260612_120000_content_indexes';
import * as migration_20260613_215907_add_settings_organization from './20260613_215907_add_settings_organization';
import * as migration_20260613_221131_add_marketing_seo from './20260613_221131_add_marketing_seo';

export const migrations = [
  {
    up: migration_20260518_163754_stories_collections.up,
    down: migration_20260518_163754_stories_collections.down,
    name: '20260518_163754_stories_collections',
  },
  {
    up: migration_20260518_185513_bookings.up,
    down: migration_20260518_185513_bookings.down,
    name: '20260518_185513_bookings',
  },
  {
    up: migration_20260612_120000_content_indexes.up,
    down: migration_20260612_120000_content_indexes.down,
    name: '20260612_120000_content_indexes',
  },
  {
    up: migration_20260613_215907_add_settings_organization.up,
    down: migration_20260613_215907_add_settings_organization.down,
    name: '20260613_215907_add_settings_organization',
  },
  {
    up: migration_20260613_221131_add_marketing_seo.up,
    down: migration_20260613_221131_add_marketing_seo.down,
    name: '20260613_221131_add_marketing_seo'
  },
];
