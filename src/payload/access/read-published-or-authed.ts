import type { Access } from "payload";

/** Public sees published only; CMS users see everything */
export const readPublishedOrAuthed: Access = ({ req: { user } }) => {
  if (user) return true;
  return { published: { equals: true } };
};
