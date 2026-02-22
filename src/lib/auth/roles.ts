export const Role = {
  ADMIN: "admin",
  USER: "user",
} as const;

export type RoleType = (typeof Role)[keyof typeof Role];

export function isValidRole(role: unknown): role is RoleType {
  return role === Role.ADMIN || role === Role.USER;
}
