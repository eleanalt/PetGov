export function effectiveRole(user) {
  return user?.role ?? "public";
}

export function isAllowed(itemRoles, user) {
  const role = effectiveRole(user);
  return itemRoles.includes(role);
}
