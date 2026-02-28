import { createBrowserRouter } from "react-router";
import AdminLayout from "./components/AdminLayout";
import Dashboard from "./components/Dashboard";
import EventList from "./components/EventList";
import CreateEvent from "./components/CreateEvent";
import ManageParticipants from "./components/ManageParticipants";
import AllParticipants from "./components/AllParticipants";
import ManageForms from "./components/ManageForms";
import ManageCertificates from "./components/ManageCertificates";
import EventLanding from "./components/EventLanding";
import NotFound from "./components/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: EventLanding,
  },
  {
    path: "/event/:eventId",
    Component: EventLanding,
  },
  {
    path: "/admin",
    Component: AdminLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "events/upcoming", Component: EventList },
      { path: "events/past", Component: EventList },
      { path: "events/create", Component: CreateEvent },
      { path: "events/edit/:eventId", Component: CreateEvent },
      { path: "participants", Component: AllParticipants },
      { path: "participants/:eventId", Component: ManageParticipants },
      { path: "forms", Component: ManageForms },
      { path: "certificates", Component: ManageCertificates },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);