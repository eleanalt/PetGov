# PetGov – Pet Management & Veterinary Services Platform

A full-featured web application simulating a national pet registration and veterinary services system. Built with React, React Router, and Material UI, backed by a JSON Server REST API. The platform supports two distinct user roles — **Pet Owners** and **Veterinarians** — each with a dedicated, personalized experience.

---

## Demo Login

| Role | Email | Password |
|---|---|---|
| Veterinarian | vet@demo.gr | 1234 |
| Pet Owner | maria@demo.gr | 1234 |

---

## Features

### Pet Owner
- View and edit personal profile
- Manage registered pets and view each pet's health booklet
- Search for veterinarians by area, specialty, availability, and more
- Book, view, and cancel appointments (confirmed or pending)
- View full appointment history
- Submit reviews for veterinarians after completed visits
- File lost pet declarations (draft or final submission)
- File found pet reports

### Veterinarian
- View and edit professional profile (credentials, clinic address, specialization)
- Set availability — days, hours, and appointment types
- Manage incoming appointment requests (confirm or reject)
- Register new pets via a step-by-step wizard (microchip, species, gender, DOB, etc.)
- Save pet registrations as drafts or submit them permanently
- Record medical procedures (vaccinations, surgeries, sterilizations, etc.)
- View full visit and medical procedure history per pet
- Print pet health booklets

### All Users
- Browse lost pet listings without authentication
- Submit a found pet report with location, photo, date, and finder details
- Role-based routing and access control throughout the app

---

## Tech Stack

- **Frontend**: React, React Router, Material UI
- **Backend**: JSON Server (mock REST API)
- **State**: React state + persistent JSON Server storage
- **UI**: Shared AppLayout with role-aware navbar, breadcrumbs, and footer across all pages

---

## Run Locally

```bash
# Install dependencies
npm install

# Start JSON Server (mock backend)
npx json-server --watch db.json --port 3001

# Start the React app
npm start
```

---

## Project Structure

```
src/
├── components/       # Shared UI components (navbar, footer, layout)
├── pages/
│   ├── owner/        # Pet owner views
│   └── vet/          # Veterinarian views
├── routes/           # Role-based routing
└── App.jsx
```
