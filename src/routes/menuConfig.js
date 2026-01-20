export const MAIN_NAV = [
  { label: "Αρχική", to: "/", roles: ["public", "citizen", "owner", "vet"] },
  { label: "Απολεσθέντα Ζώα", to: "/lost", roles: ["public", "citizen", "owner", "vet"] },
];

/**
 * ✅ Αυτό εμφανίζεται ΠΑΝΩ δεξιά δίπλα στο ονοματεπώνυμο
 * (όχι μέσα στο dropdown).
 */
export const HEADER_ACTIONS = {
  owner: { label: "Dashboard", to: "/owner" },
  vet: { label: "Dashboard", to: "/vet" }, // αν δεν το θες για vet, κάντο comment ή σβήστο
};

export const USER_MENU = {
  owner: [
    { label: "Προφίλ", to: "/owner/profile" },
    { label: "Τα κατοικίδιά μου", to: "/owner/pets" },
    { label: "Τα ραντεβού μου", to: "/owner/appointments" },
    { label: "Δηλώσεις απώλειας", to: "/owner/lost" },
    { label: "Οι δηλώσεις εύρεσης μου", to: "/owner/found-reports" },
  ],
  vet: [
    { label: "Προφίλ", to: "/vet/profile" },
    { label: "Καταγραφές", to: "/vet/registrations" },
    { label: "Ιατρικές Πράξεις", to: "/vet/acts" },
    { label: "Ραντεβού", to: "/vet/appointments" },
    { label: "Αξιολογήσεις", to: "/vet/reviews" },
  ],
};

export const ROLE_LABELS = {
  owner: "Ιδιοκτήτης",
  vet: "Κτηνίατρος",
  citizen: "Πολίτης",
  public: "Επισκέπτης",
};

export function effectiveRole(user) {
  return user?.role ?? "public";
}

export function isAllowed(itemRoles, user) {
  return itemRoles.includes(effectiveRole(user));
}

/** ✅ ασφαλές helper */
export function getUserMenu(user) {
  const role = effectiveRole(user);
  return USER_MENU[role] ?? [];
}

export function getHeaderAction(user) {
  const role = effectiveRole(user);
  return HEADER_ACTIONS[role] ?? null;
}
