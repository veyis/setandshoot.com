import * as migration_20260518_163754_stories_collections from './20260518_163754_stories_collections';
import * as migration_20260518_185513_bookings from './20260518_185513_bookings';

export const migrations = [
  {
    up: migration_20260518_163754_stories_collections.up,
    down: migration_20260518_163754_stories_collections.down,
    name: '20260518_163754_stories_collections',
  },
  {
    up: migration_20260518_185513_bookings.up,
    down: migration_20260518_185513_bookings.down,
    name: '20260518_185513_bookings'
  },
];
