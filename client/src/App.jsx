
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import ParkingLots from "./pages/ParkingLots";
import ParkingLotDetails from "./pages/ParkingLotDetails";
import Booking from "./pages/Booking";
import MyReservations from "./pages/MyReservations";
import Vehicles from "./pages/Vehicles";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManageLots from "./pages/AdminManageLots";
import AdminManageSpaces from "./pages/AdminManageSpaces";

import {
    ProtectedRoute,
    AdminRoute
} from "./components/ProtectedRoute";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Public routes */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Routes for logged-in users */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<Navbar />}>
                      <Route 
                          path="/dashboard"
                          element={<Dashboard />}
                      />

                    <Route
                        path="/parking-lots"
                        element={<ParkingLots />}
                    />
                    <Route
                        path="/parking-lots/:lotId"
                        element={<ParkingLotDetails />}
                    />

                    <Route
                        path="/book/:spaceId"
                        element={<Booking />}
                    />
                    <Route
                        path="/vehicles"
                        element={<Vehicles />}
                    />

                    <Route
                        path="/reservations"
                        element={<MyReservations />}
                    />
                </Route>
              </Route>

                {/* Admin-only routes */}
                <Route element={<AdminRoute />}>
                  <Route element={<Navbar />}>
                    <Route
                        path="/admin"
                        element={<AdminDashboard />}
                    />
                    <Route
                        path="/admin/manage-spaces"
                        element={<AdminManageSpaces />}
                    />
                    <Route
                        path="/admin/manage-lots"
                        element={<AdminManageLots />}
                    />
                </Route>
              </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
