import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RequireAuth from "./auth/RequireAuth";

import LostPets from "./pages/lost/LostPets";
import LostPetDetails from "./pages/lost/LostPetDetails";
import FoundReportWizard from "./pages/lost/FoundReportWizard";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerPets from "./pages/owner/OwnerPets";
import OwnerAppointments from "./pages/owner/OwnerAppointments";
import OwnerLost from "./pages/owner/OwnerLost";

import VetDashboard from "./pages/vet/VetDashboard";
import VetAvailability from "./pages/vet/VetAvailability";
import VetAppointments from "./pages/vet/VetAppointments";
import VetActs from "./pages/vet/VetActs";

import OwnersFaq from "./pages/info/OwnersFaq";
import VetsFaq from "./pages/info/VetsFaq";
import CitizensFaq from "./pages/info/CitizensFaq";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> 
          {/* Public */}
          <Route path="/lost" element={<LostPets />} />
          <Route path="/lost/:id" element={<LostPetDetails />} />
          <Route path="/lost/:id/found" element={<FoundReportWizard />} />
          <Route path="/info/owners" element={<OwnersFaq />} />
          <Route path="/info/vets" element={<VetsFaq />} />
          <Route path="/info/citizens" element={<CitizensFaq />} />

          {/* Owner protected */}
          <Route element={<RequireAuth allowedRoles={["owner"]} />}>
            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/pets" element={<OwnerPets />} />
            <Route path="/owner/appointments" element={<OwnerAppointments />} />
            <Route path="/owner/lost" element={<OwnerLost />} />
          </Route>

          {/* Vet protected */}
          <Route element={<RequireAuth allowedRoles={["vet"]} />}>
            <Route path="/vet" element={<VetDashboard />} />
            <Route path="/vet/availability" element={<VetAvailability />} />
            <Route path="/vet/appointments" element={<VetAppointments />} />
            <Route path="/vet/acts" element={<VetActs />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
