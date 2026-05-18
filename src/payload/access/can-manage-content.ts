import type { Access } from "payload";

/** Admin or editor — day-to-day CMS work */
export const canManageContent: Access = ({ req: { user } }) => {
  return Boolean(
    user && user.collection === "users" && (user.role === "admin" || user.role === "editor"),
  );
};
