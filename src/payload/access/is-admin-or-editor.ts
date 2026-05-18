import type { Access } from "payload";

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(
    user && user.collection === "users" && (user.role === "admin" || user.role === "editor"),
  );
};
