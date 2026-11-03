
import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <>
        <nav className="navbar">
            <Link to="/dashboard" className="brand">
                Smart Parking
            </Link>

            <div className="nav-links">
                {user?.role === "ADMIN" ? (
                    <Link to="/admin">Dashboard</Link>
                ) : (
                    <>
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/parking-lots">Parking Lots</Link>
                        <Link to="/reservations">My Reservations</Link>
                        <Link to="/vehicles">My Vehicles</Link>
                    </>
                )}

                <span>{user?.name}</span>

                <button onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </nav>
        <Outlet />
    </>
    );
}

export default Navbar;
