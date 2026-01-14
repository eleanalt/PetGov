import React, { useState } from "react";
import {
  Container,
  Typography,
  TextField,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Button,
  Chip,
  Box,
  Divider,
  Collapse,
} from "@mui/material";

export default function OwnerVetSearch() {
  const [filters, setFilters] = useState({
    area: "",
    specialization: "",
    day: "",
    minExperience: "",
  });

  const [openVetId, setOpenVetId] = useState(null);

  const vets = [
    {
      id: 1,
      name: "Δρ. Παπαδόπουλος",
      area: "Αθήνα",
      specialization: "Μικρά Ζώα",
      experience: 10,
      studies: "Κτηνιατρική ΑΠΘ",
      availability: ["Δευτέρα", "Τετάρτη"],
      bio: "Κτηνίατρος μικρών ζώων με πολυετή εμπειρία.",
    },
    {
      id: 2,
      name: "Δρ. Ιωάννου",
      area: "Θεσσαλονίκη",
      specialization: "Χειρουργική",
      experience: 5,
      studies: "Κτηνιατρική Παν. Θεσσαλίας",
      availability: ["Τρίτη", "Πέμπτη"],
      bio: "Εξειδίκευση στη χειρουργική και μετεγχειρητική φροντίδα.",
    },
  ];

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const filteredVets = vets.filter((vet) => {
    return (
      (!filters.area || vet.area === filters.area) &&
      (!filters.specialization ||
        vet.specialization === filters.specialization) &&
      (!filters.day || vet.availability.includes(filters.day)) &&
      (!filters.minExperience ||
        vet.experience >= Number(filters.minExperience))
    );
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" gutterBottom>
        Αναζήτηση Κτηνιάτρων
      </Typography>

      {/* Φίλτρα */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Περιοχή"
                name="area"
                fullWidth
                value={filters.area}
                onChange={handleChange}
              >
                <MenuItem value="">Όλες</MenuItem>
                <MenuItem value="Αθήνα">Αθήνα</MenuItem>
                <MenuItem value="Θεσσαλονίκη">Θεσσαλονίκη</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Ειδίκευση"
                name="specialization"
                fullWidth
                value={filters.specialization}
                onChange={handleChange}
              >
                <MenuItem value="">Όλες</MenuItem>
                <MenuItem value="Μικρά Ζώα">Μικρά Ζώα</MenuItem>
                <MenuItem value="Χειρουργική">Χειρουργική</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                select
                label="Ημέρα"
                name="day"
                fullWidth
                value={filters.day}
                onChange={handleChange}
              >
                <MenuItem value="">Όλες</MenuItem>
                <MenuItem value="Δευτέρα">Δευτέρα</MenuItem>
                <MenuItem value="Τρίτη">Τρίτη</MenuItem>
                <MenuItem value="Τετάρτη">Τετάρτη</MenuItem>
                <MenuItem value="Πέμπτη">Πέμπτη</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={3}>
              <TextField
                label="Ελάχιστη Εμπειρία (έτη)"
                name="minExperience"
                type="number"
                fullWidth
                value={filters.minExperience}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Αποτελέσματα */}
      <Grid container spacing={3}>
        {filteredVets.map((vet) => (
          <Grid item xs={12} md={6} key={vet.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{vet.name}</Typography>
                <Typography>Περιοχή: {vet.area}</Typography>
                <Typography>Ειδίκευση: {vet.specialization}</Typography>
                <Typography>Εμπειρία: {vet.experience} έτη</Typography>

                <Box sx={{ mt: 1 }}>
                  {vet.availability.map((day) => (
                    <Chip
                      key={day}
                      label={day}
                      size="small"
                      sx={{ mr: 0.5 }}
                    />
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  sx={{ mt: 2 }}
                  onClick={() =>
                    setOpenVetId(openVetId === vet.id ? null : vet.id)
                  }
                >
                  {openVetId === vet.id
                    ? "Απόκρυψη Λεπτομερειών"
                    : "Προβολή Λεπτομερειών"}
                </Button>

                {/* Λεπτομέρειες */}
                <Collapse in={openVetId === vet.id}>
                  <Divider sx={{ my: 2 }} />
                  <Typography>
                    <strong>Σπουδές:</strong> {vet.studies}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>
                    <strong>Προφίλ:</strong> {vet.bio}
                  </Typography>

                  <Button
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    Αίτημα Ραντεβού
                  </Button>
                </Collapse>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {filteredVets.length === 0 && (
          <Typography sx={{ mt: 3 }}>
            Δεν βρέθηκαν κτηνίατροι με τα συγκεκριμένα κριτήρια.
          </Typography>
        )}
      </Grid>
    </Container>
  );
}

