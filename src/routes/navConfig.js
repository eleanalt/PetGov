export const MAIN_NAV = [
  { label: "Αρχική", to: "/", roles: ["public", "citizen", "owner", "vet"] },
  { label: "Απωλεσθέντα Ζώα", to: "/lost", roles: ["public", "citizen", "owner", "vet"] }
];

// Dropdown menu ανά ρόλο (δεξιά πάνω)
export const USER_MENU = {
  owner: [
    { label: "Dashboard", to: "/owner" },
    { label: "Προφιλ", to: "/owner/profile" },
    { label: "Τα κατοικίδιά μου", to: "/owner/pets" },
    { label: "Τα ραντεβού μου", to: "/owner/appointments" },
    { label: "Δηλώσεις απώλειας", to: "/owner/lost" }
  ],
  vet: [
    { label: "Dashboard", to: "/vet" },
    { label: "Διαθεσιμότητα", to: "/vet/availability" },
    { label: "Ραντεβού", to: "/vet/appointments" },
    { label: "Ιατρικές πράξεις", to: "/vet/acts" }
  ],
  citizen: [
    { label: "Οι αναφορές μου", to: "/citizen/reports" }
  ]
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
