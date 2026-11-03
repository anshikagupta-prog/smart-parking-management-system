
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

function Dashboard() {
    const { user } = useAuth();
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const response = await API.get("/reservations/my");
                setReservations(response.data.reservations);
            } catch (error) {
                console.error("Unable to fetch reservations:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    const now = new Date();

    const upcoming = reservations.filter(
        (r) =>
            r.status === "CONFIRMED" &&
            new Date(r.starts_at) > now
    );

    const active = reservations.filter(
        (r) => r.status === "CHECKED_IN"
    );

    const completed = reservations.filter(
        (r) => r.status === "COMPLETED"
    );

    return (
        <div className="dashboard-container">

            <div className="dashboard-heading">
                <div>
                    <h1>Welcome, {user?.name}!</h1>
                    <p>Here's an overview of your parking activity.</p>
                </div>
            </div>

            <div className="stats-grid">

                <div className="stat-card">
                    <h3>Total Reservations</h3>
                    <h2>{loading ? "..." : reservations.length}</h2>
                </div>

                <div className="stat-card">
                    <h3>Upcoming Reservations</h3>
                    <h2>{loading ? "..." : upcoming.length}</h2>
                </div>

                <div className="stat-card">
                    <h3>Active Sessions</h3>
                    <h2>{loading ? "..." : active.length}</h2>
                </div>

                <div className="stat-card">
                    <h3>Completed Reservations</h3>
                    <h2>{loading ? "..." : completed.length}</h2>
                </div>

            </div>

            <h2 className="section-heading">Quick Actions</h2>

            <div className="actions-grid">
                <Link to="/parking-lots" className="action-card">
                    <h3>Find Parking</h3>
                    <p>Explore parking lots and available spaces.</p>
                </Link>

                <Link to="/reservations" className="action-card">
                    <h3>My Reservations</h3>
                    <p>View and manage your bookings.</p>
                </Link>
            </div>

        </div>
    );
}

export default Dashboard;
