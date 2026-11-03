
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";

function Booking() {
    const { spaceId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const { lot, space, startsAt, endsAt } = location.state || {};

    const [vehicles, setVehicles] = useState([]);
    const [vehicleId, setVehicleId] = useState("");
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch user's registered vehicles
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await API.get("/vehicles");
                setVehicles(response.data.vehicles || []);
            } catch (error) {
                setError("Unable to fetch your vehicles.");
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []);

    const handleBooking = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        if (!vehicleId) {
            setError("Please select a vehicle.");
            return;
        }

        setBooking(true);

        try {
            const response = await API.post("/reservations", {
                vehicle_id: Number(vehicleId),
                space_id: Number(spaceId),
                starts_at: new Date(startsAt).toISOString(),
                ends_at: new Date(endsAt).toISOString()
            });

            setSuccess("Your parking reservation was successful!");

            setTimeout(() => {
                navigate("/reservations");
            }, 1500);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to create reservation."
            );
        } finally {
            setBooking(false);
        }
    };

    if (!lot || !space || !startsAt || !endsAt) {
        return (
            <div className="page-container">
                <h2>Booking details unavailable</h2>
                <p>Please select a parking space again.</p>
                <button onClick={() => navigate("/parking-lots")}>
                    Browse Parking Lots
                </button>
            </div>
        );
    }

    if (loading) {
        return <p className="page-message">Loading booking details...</p>;
    }

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>Confirm Your Reservation</h1>
                <p>Review your booking before confirming.</p>
            </div>

            <div className="booking-card">

                <h2>Parking Details</h2>

                <div className="booking-details">
                    <p><strong>Parking Lot:</strong> {lot.name}</p>
                    <p><strong>Address:</strong> {lot.address}, {lot.city}</p>
                    <p><strong>Space Number:</strong> {space.space_number}</p>
                    <p><strong>Space Type:</strong> {space.space_type}</p>
                    <p><strong>Start:</strong> {new Date(startsAt).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(endsAt).toLocaleString()}</p>
                </div>

                <form onSubmit={handleBooking}>

                    <h2>Select Your Vehicle</h2>

                    {vehicles.length === 0 ? (
                        <div>
                            <p>You haven't registered any vehicles yet.</p>
                            <button
                                type="button"
                                onClick={() => navigate("/vehicles")}
                            >
                                Add a Vehicle
                            </button>
                        </div>
                    ) : (
                        <>
                            <select
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                required
                            >
                                <option value="">Select a vehicle</option>

                                {vehicles.map((vehicle) => (
                                    <option
                                        key={vehicle.id}
                                        value={vehicle.id}
                                    >
                                        {vehicle.registration_number} - {vehicle.vehicle_type}
                                    </option>
                                ))}
                            </select>

                            {error && <p className="error">{error}</p>}
                            {success && <p className="success">{success}</p>}

                            <button type="submit" disabled={booking}>
                                {booking ? "Confirming..." : "Confirm Reservation"}
                            </button>
                        </>
                    )}

                </form>

            </div>

        </div>
    );
}

export default Booking;
