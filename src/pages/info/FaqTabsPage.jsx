import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Container } from "@mui/material";
import { useLocation, useSearchParams } from "react-router-dom";
import InfoFaqPage from "./InfoFaqPage";
import { useAuth } from "../../auth/AuthContext";

const TAB_OWNER = "owner";
const TAB_CITIZEN = "citizen";
const TAB_VET = "vet";

function normalizeTab(v) {
  if (v === TAB_OWNER || v === TAB_CITIZEN || v === TAB_VET) return v;
  return null;
}

export default function FaqTabsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // 1) από URL: ?tab=owner|vet|citizen
  const tabFromQuery = normalizeTab(searchParams.get("tab"));
  // 2) από navigation state: navigate("/info/faqs", { state: { tab: "vet" } })
  const tabFromState = normalizeTab(location.state?.tab);
  // 3) από role χρήστη (αν είναι logged-in)
  const tabFromRole = normalizeTab(user?.role);

  // Προτεραιότητα: query > state > role > default
  const initialTab = tabFromQuery || tabFromState || tabFromRole || TAB_OWNER;

  const [tab, setTab] = useState(initialTab);

  // Συγχρονισμός αν αλλάξει query/state/role (π.χ. login/logout)
  useEffect(() => {
    const next = tabFromQuery || tabFromState || tabFromRole || TAB_OWNER;
    setTab(next);
  }, [tabFromQuery, tabFromState, tabFromRole]);

  // Όταν αλλάζει tab από click, γράψε το στο URL (?tab=...)
  const setTabAndUrl = (nextTab) => {
    setTab(nextTab);
    setSearchParams({ tab: nextTab }, { replace: true });
  };

  const ownerProps = useMemo(
    () => ({
      crumbLabel: "Συχνές Ερωτήσεις",
      title: "Συχνές Ερωτήσεις",
      intro:
        "Η σελίδα αυτή βοηθά τους ιδιοκτήτες κατοικιδίων να διαχειριστούν εύκολα τις βασικές λειτουργίες της πλατφόρμας: καταγραφή κατοικιδίων, δήλωση απώλειας/εύρεσης, πρόσβαση στο βιβλιάριο υγείας και επικοινωνία με κτηνιάτρους.",
      faqs: [
        {
          q: "Πώς μπορώ να δω το βιβλιάριο υγείας του κατοικιδίου μου;",
          a: "Μετά τη σύνδεση, μεταβείτε στο «Τα κατοικίδιά μου» και επιλέξτε το κατοικίδιο.\nΕκεί θα δείτε το «Βιβλιάριο Υγείας» με όλες τις καταχωρημένες πράξεις.",
        },
        {
          q: "Πώς δηλώνω ότι χάθηκε το κατοικίδιό μου;",
          a: "Μεταβείτε στο  «Δηλώσεις» επιλέξτε «Νέα δήλωση απώλειας».\nΣυμπληρώστε περιοχή/ημερομηνία/περιγραφή και (προαιρετικά) φωτογραφίες.",
        },
        {
          q: "Μπορώ να τροποποιήσω μια δήλωση απώλειας που έχω υποβάλει;",
          a: "Ναι, όσο η δήλωση είναι σε κατάσταση  «Πρόχειρη».\nΑφού επιβεβαιωθεί/οριστικοποιηθεί, μπορεί να απαιτείται νέα δήλωση.",
        },
        {
          q: "Πώς μπορώ να βρω κτηνίατρο στην περιοχή μου;",
          a: "Από «Αναζήτηση κτηνιάτρων» φιλτράρετε με περιοχή και (αν υπάρχει) ειδικότητα.\nΜπορείτε να δείτε προφίλ και αξιολογήσεις.",
        },
        {
          q: "Πώς κλείνω ραντεβού με κτηνίατρο;",
          a: "Από «Ραντεβού» → «Νέο ραντεβού», επιλέγετε κτηνίατρο, κατοικίδιο, τύπο πράξης και διαθέσιμη ώρα.\nΤο αίτημα θα εμφανιστεί ως «Εκρεμμές» μέχρι να επιβεβαιωθεί.",
        },
        {
          q: "Μπορώ να αξιολογήσω έναν κτηνίατρο;",
          a: "Ναι, μετά την ολοκλήρωση ενός ραντεβού μπορείτε να αφήσετε αξιολόγηση και σχόλιο.\nΟι αξιολογήσεις βοηθούν άλλους ιδιοκτήτες.",
        },
      ],
    }),
    []
  );

  const citizenProps = useMemo(
    () => ({
      crumbLabel: "Συχνές Ερωτήσεις",
      title: "Συχνές Ερωτήσεις",
      intro:
        "Εδώ θα βρείτε πληροφορίες για την αναζήτηση απολεσθέντων ζώων και την υποβολή αναφοράς εύρεσης, ακόμη και χωρίς λογαριασμό.",
      faqs: [
        {
          q: "Πώς μπορώ να αναζητήσω ένα χαμένο κατοικίδιο;",
          a: "Στη σελίδα «Απολεσθέντα ζώα» χρησιμοποιήστε φίλτρα (περιοχή, είδος κ.λπ.).\nΘα δείτε αποτελέσματα χωρίς να απαιτείται σύνδεση.",
        },
        {
          q: "Πώς μπορώ να δηλώσω ότι βρήκα ένα κατοικίδιο;",
          a: "Σε μια αγγελία απολεσθέντος επιλέξτε «Αναφορά εύρεσης».\nΣυμπληρώστε τοποθεσία, ημερομηνία και στοιχεία επικοινωνίας.",
        },
        {
          q: "Χρειάζεται να κάνω εγγραφή για αναζήτηση χαμένων κατοικιδίων;",
          a: "Όχι. Η αναζήτηση είναι διαθέσιμη χωρίς λογαριασμό.\nΗ εγγραφή είναι προαιρετική.",
        },
        {
          q: "Τι πρέπει να κάνω αν βρω ένα τραυματισμένο κατοικίδιο;",
          a: "Επικοινωνήστε άμεσα με κοντινό κτηνίατρο ή τις αρμόδιες αρχές.\nΜπορείτε επίσης να κάνετε αναφορά εύρεσης για να εντοπιστεί ο ιδιοκτήτης.",
        },
      ],
    }),
    []
  );

  const vetProps = useMemo(
    () => ({
      crumbLabel: "Συχνές Ερωτήσεις",
      title: "Συχνές Ερωτήσεις",
      intro:
        "Η σελίδα αυτή βοηθά τους κτηνιάτρους να διαχειριστούν το προφίλ τους, τις ιατρικές πράξεις, τη διαθεσιμότητα και τα ραντεβού μέσω της πλατφόρμας.",
      faqs: [
        {
          q: "Πώς μπορώ να εγγραφώ ως επαγγελματίας κτηνίατρος στην πλατφόρμα;",
          a: "Στην «Εγγραφή» επιλέγετε «Κτηνίατρος» και συμπληρώνετε ΑΦΜ και στοιχεία κλινικής.\nΜετά την εγγραφή μπορείτε να ενημερώσετε το επαγγελματικό προφίλ.",
        },
        {
          q: "Πώς καταχωρώ ιατρικές πράξεις στο βιβλιάριο υγείας ενός κατοικιδίου;",
          a: "Από «Ιατρικές πράξεις» επιλέγετε κατοικίδιο (ή microchip) και καταχωρείτε τύπο πράξης, ημερομηνία και σημειώσεις.\nΗ πράξη αποθηκεύεται στο ιστορικό του ζώου.",
        },
        {
          q: "Πώς διαχειρίζομαι τη διαθεσιμότητά μου;",
          a: "Από «Διαθεσιμότητα» ορίζετε ημέρες/ώρες και τύπους πράξεων που δέχεστε.\nΜε βάση αυτά εμφανίζονται διαθέσιμα slots για ραντεβού.",
        },
        {
          q: "Πώς βλέπω/επιβεβαιώνω ραντεβού;",
          a: "Από «Ραντεβού» βλέπετε αιτήματα σε κατάσταση «pending».\nΜπορείτε να τα επιβεβαιώσετε ή να τα απορρίψετε.",
        },
        {
          q: "Μπορώ να δω αξιολογήσεις;",
          a: "Ναι, στο «Προφίλ» εμφανίζονται οι αξιολογήσεις και ο μέσος όρος.\nΟι αξιολογήσεις προέρχονται από ολοκληρωμένα ραντεβού.",
        },
      ],
    }),
    []
  );

  const activeProps =
    tab === TAB_OWNER ? ownerProps : tab === TAB_VET ? vetProps : citizenProps;

  return (
    <Box sx={{ bgcolor: "grey.50", py: 3 }}>
      <Container maxWidth="lg">
        {/* Tabs όπως στην εικόνα */}
        <Box
          sx={{
            bgcolor: "grey.200",
            borderRadius: 999,
            p: 0.75,
            display: "flex",
            gap: 1,
            justifyContent: "space-between",
            maxWidth: 860,
            mx: "auto",
            mb: 3,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <TabPill active={tab === TAB_OWNER} onClick={() => setTabAndUrl(TAB_OWNER)}>
            Ιδιοκτήτες
          </TabPill>

          <TabPill active={tab === TAB_VET} onClick={() => setTabAndUrl(TAB_VET)}>
            Κτηνίατροι
          </TabPill>

          <TabPill active={tab === TAB_CITIZEN} onClick={() => setTabAndUrl(TAB_CITIZEN)}>
            Απλοί χρήστες
          </TabPill>
        </Box>
      </Container>

      <InfoFaqPage {...activeProps} />
    </Box>
  );
}

function TabPill({ active, onClick, children }) {
  return (
    <Button
      onClick={onClick}
      variant="contained"
      disableElevation
      sx={{
        flex: 1,
        borderRadius: 999,
        textTransform: "none",
        fontWeight: 900,
        py: 1.1,
        minWidth: { xs: "100%", sm: 0 },
        bgcolor: active ? "#EF6C00" : "transparent",
        color: active ? "common.white" : "text.primary",
        "&:hover": {
          bgcolor: active ? "#E65100" : "rgba(0,0,0,0.06)",
        },
      }}
    >
      {children}
    </Button>
  );
}
