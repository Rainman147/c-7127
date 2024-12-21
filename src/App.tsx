import { RouterProvider, createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import TemplateManager from "@/pages/TemplateManager";
import PatientsPage from "@/pages/Patients";
import { SidebarProvider } from "@/contexts/SidebarContext";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "c/:sessionId",
        element: <Index />,
      },
      {
        path: "c/new",
        element: <Index />,
      },
      {
        path: "templates",
        element: <TemplateManager />,
      },
      {
        path: "patients",
        element: <PatientsPage />,
      },
    ],
  },
  {
    path: "/auth",
    element: <Auth />,
  },
]);

function App() {
  console.log('[App] Initializing application with router and SidebarProvider');
  
  return (
    <SidebarProvider>
      <RouterProvider router={router} />
    </SidebarProvider>
  );
}

export default App;