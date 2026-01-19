export const MAIN_NAV = [
  { label: "Αρχική", to: "/", roles: ["public", "citizen", "owner", "vet"] },
  { label: "Απολεσθέντα Ζώα", to: "/lost", roles: ["public", "citizen", "owner", "vet"] }
];

export const USER_MENU = {
  owner: [
    { label: "Dashboard", to: "/owner" },
    { label: "Προφίλ", to: "/owner/profile" },
    { label: "Τα κατοικίδιά μου", to: "/owner/pets" },
    { label: "Τα ραντεβού μου", to: "/owner/appointments" },
    { label: "Δηλώσεις απώλειας", to: "/owner/lost" }
  ],
  vet: [
    { label: "Οδηγός", to: "/vet" },
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
  public: "Επισκέπτης"
};

export function effectiveRole(user) {
  return user?.role ?? "public";
}

export function isAllowed(itemRoles, user) {
  return itemRoles.includes(effectiveRole(user));
}
