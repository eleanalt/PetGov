import React from "react";
import { Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import RequireAuth from "./auth/RequireAuth";

import LostPets from "./pages/lost/LostPets";
import LostPetDetails from "./pages/lost/LostPetDetails";
import FoundReportWizard from "./pages/lost/FoundReportWizard";

import OwnerPets from "./pages/owner/OwnerPets";
import OwnerAppointments from "./pages/owner/OwnerAppointments";
import OwnerLost from "./pages/owner/OwnerLost";
import OwnerHealthBook from "./pages/owner/OwnerHealthBook";
import OwnerGuide from "./pages/owner/OwnerGuide";
import OwnerLostHistory from "./pages/owner/OwnerLostHistory";
import OwnerLostWizard from "./pages/owner/OwnerLostWizard";
import OwnerFoundMine from "./pages/owner/OwnerFoundMine";
import OwnerFoundView from "./pages/owner/OwnerFoundView";
import OwnerAppointmentSearch from "./pages/owner/OwnerAppointmentSearch";
import OwnerVetDetails from "./pages/owner/OwnerVetDetails";
import OwnerAppointmentWizard from "./pages/owner/OwnerAppointmentWizard";
import OwnerReview from "./pages/owner/OwnerReview";
import OwnerProfile from "./pages/owner/OwnerProfile";
import OwnerLayout from "./layouts/OwnerLayout";
import OwnerMyFoundReports from "./pages/owner/OwnerMyFoundReports";

import VetActs from "./pages/vet/VetActs";
import VetActNew from "./pages/vet/VetActNew";
import VetActsHistory from "./pages/vet/VetActsHistory";
import VetHealthBook from "./pages/vet/VetHealthBook";
import VetGuide from "./pages/vet/VetGuide";
import VetProfile from "./pages/vet/VetProfile";
import VetRegistrations from "./pages/vet/VetRegistrations";
import VetRegistrationWizard from "./pages/vet/VetRegistrationWizard";
import VetRegistrationDrafts from "./pages/vet/VetRegistrationDrafts";
import VetAvailability from "./pages/vet/VetAvailability";
import VetAvailabilityEdit from "./pages/vet/VetAvailabilityEdit";
import VetAppointments from "./pages/vet/VetAppointments";
import VetReviews from "./pages/vet/VetReviews";
import VetActDurations from "./pages/vet/VetActDurations";


import OwnersFaq from "./pages/info/OwnersFaq";
import VetsFaq from "./pages/info/VetsFaq";
import CitizensFaq from "./pages/info/CitizensFaq";

export default function App() {
  return (
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
       {/* Owner protected */}
<Route element={<RequireAuth allowedRoles={["owner"]} />}>
  <Route path="/owner" element={<OwnerLayout />}>
    {/* default owner page */}
    <Route path="/owner" element={<OwnerGuide />} />
          <Route path="/owner/pets" element={<OwnerPets />} />
          <Route path="/owner/appointments" element={<OwnerAppointments />} />
          <Route path="/owner/lost" element={<OwnerLost />} />
          <Route path="/owner/healthbook/:petId" element={<OwnerHealthBook />} />
          <Route path="/owner/guide" element={<OwnerGuide />} />
          <Route path="/owner/found/:id" element={<OwnerFoundView />} />
          <Route path="/owner/found/view" element={<OwnerFoundView />} /> 
          <Route path="/owner/pets/:petId/healthbook" element={<OwnerHealthBook />} />
          <Route path="/owner/lost" element={<OwnerLost />} />
          <Route path="/owner/lost/history" element={<OwnerLostHistory />} />
          <Route path="/owner/appointments/new" element={<OwnerAppointmentSearch />} />
          <Route path="/owner/appointments/vet/:vetId" element={<OwnerVetDetails />} />
          <Route path="/owner/appointments/review/:appointmentId" element={<OwnerReview />} />
          <Route path="/owner/appointments/new" element={<OwnerAppointmentWizard />} />
          <Route path="/owner/appointments/new/:vetId" element={<OwnerAppointmentWizard />} />
          <Route path="/owner/profile" element={<OwnerProfile />} />
        
         <Route path="/owner/found-reports" element={<OwnerMyFoundReports />} />


          <Route path="/owner/lost/new" element={<OwnerLostWizard />} />
          <Route path="/owner/lost/:lostId" element={<OwnerLostWizard />} />        {/* view */}
          <Route path="/owner/lost/:lostId/edit" element={<OwnerLostWizard />} />   {/* edit draft */}

          <Route path="/owner/found" element={<OwnerFoundMine />} />
  </Route>
</Route>

        {/* Vet protected */}
        <Route element={<RequireAuth allowedRoles={["vet"]} />}>
        <Route path="/owner" element={<OwnerLayout />}></Route>
          <Route path="/vet" element={<VetGuide />} />
          <Route path="/vet/profile" element={<VetProfile />} />

          <Route path="/vet/registrations" element={<VetRegistrations />} />
          <Route path="/vet/registrations/new" element={<VetRegistrationWizard />} />
          <Route path="/vet/registrations/:regId" element={<VetRegistrationWizard />} />
          <Route path="/vet/registrations/drafts" element={<VetRegistrationDrafts />} />
          <Route path="/vet/acts" element={<VetActs />} />
          <Route path="/vet/acts/new/:petId" element={<VetActNew />} />
          <Route path="/vet/acts/healthbook/:petId" element={<VetHealthBook />} />
          <Route path="/vet/acts/history/:petId" element={<VetActsHistory />} />
          <Route path="/vet/availability" element={<VetAvailability />} />
          <Route path="/vet/availability/edit" element={<VetAvailabilityEdit />} />
          <Route path="/vet/availability/durations" element={<VetActDurations />} />

          <Route path="/vet/availability" element={<VetAvailability />} />
          <Route path="/vet/appointments" element={<VetAppointments />} />
          <Route path="/vet/availability/edit" element={<VetAvailabilityEdit />} />

          <Route path="/vet/reviews" element={<VetReviews />} />
          <Route path="/vet/acts" element={<VetActs />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
