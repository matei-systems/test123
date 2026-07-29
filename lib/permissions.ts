export type Role = "owner" | "admin" | "staff";

const RANK: Record<Role, number> = { staff: 0, admin: 1, owner: 2 };

export function hasMinRole(role: Role | null | undefined, min: Role): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Inhaber",
  admin: "Admin",
  staff: "Mitarbeiter",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Voller Zugriff auf alles, kann Admins ernennen und entfernen.",
  admin: "Verwaltet Programme, Standorte und Mitarbeiter (keine Admins/Inhaber).",
  staff: "Kann scannen, Stempel vergeben und Belohnungen einlösen.",
};
