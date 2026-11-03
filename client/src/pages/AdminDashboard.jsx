
import { useEffect, useState } from "react";
import API from "../services/api";
import { Link } from "react-router-dom";

function AdminDashboard() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const response = await API.get("/analytics/dashboard");
                setAnalytics(response.data.analytics);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to fetch dashboard statistics."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return <p className="page-message">Loading dashboard...</p>;
    }

    if (error) {
        return <p className="page-message error">{error}</p>;
    }

    const stats = [
        {
            title: "Total Parking Lots",
            value: analytics.total_lots
        },
        {
            title: "Total Parking Spaces",
            value: analytics.total_spaces
        },
        {
            title: "Available Spaces",
            value: analytics.available_spaces
        },
        {
            title: "Maintenance Spaces",
            value: analytics.maintenance_spaces
        },
        {
            title: "Active Sessions",
            value: analytics.active_sessions
        },
        {
            title: "Total Reservations",
            value: analytics.total_reservations
        },
        {
            title: "Completed Reservations",
            value: analytics.completed_reservations
        },
        {
            title: "Confirmed Reservations",
            value: analytics.confirmed_reservations
        }
    ];

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>Admin Dashboard</h1>
                <p>Monitor and manage your parking system.</p>
            </div>

            <div className="admin-stats-grid">

                {stats.map((stat) => (
                    <div className="stat-card" key={stat.title}>
                        <h3>{stat.title}</h3>
                        <h2>{Number(stat.value)}</h2>
                    </div>
                ))}

            </div>

            <div className="revenue-card">
                <h3>Total Overstay Revenue</h3>
                <h2>
                    ₹{Number(analytics.total_revenue).toFixed(2)}
                </h2>
            </div>

            <div className="admin-occupancy">
                <h3>Space Occupancy Estimate</h3>
                <h2>{analytics.occupancy_percentage}%</h2>

                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{
                            width: `${Math.min(
                                100,
                                Math.max(0, analytics.occupancy_percentage)
                            )}%`
                        }}
                    />
                </div>

                <p>
                    Estimated occupied spaces: {analytics.occupied_spaces}
                </p>
            </div>

            <h2 className="section-heading">Management</h2>

            <div className="actions-grid">

                <Link
                    to="/admin/manage-lots"
                    className="action-card"
                >
                    <h3>Manage Parking Lots</h3>
                    <p>Create, update and delete parking lots.</p>
                </Link>

                <Link
                    to="/admin/manage-spaces"
                    className="action-card"
                >
                    <h3>Manage Parking Spaces</h3>
                    <p>Manage individual parking spaces.</p>
                </Link>

            </div>

        </div>
    );
}

export default AdminDashboard;
