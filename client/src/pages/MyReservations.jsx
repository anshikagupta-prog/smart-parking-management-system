
import { useEffect, useState } from "react";
import API from "../services/api";

function MyReservations() {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReservations = async () => {
        try {
            const response = await API.get("/reservations/my");
            setReservations(response.data.reservations);
        } catch (error) {
            setError("Unable to fetch reservations.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    // Cancel reservation
    const handleCancel = async (id) => {
        if (!window.confirm("Are you sure you want to cancel this reservation?")) {
            return;
        }

        try {
            await API.patch(`/reservations/${id}/cancel`);
            fetchReservations();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to cancel reservation."
            );
        }
    };

    // Check in
    const handleCheckIn = async (id) => {
        try {
            await API.post(`/reservations/${id}/check-in`);
            alert("Check-in successful!");
            fetchReservations();
        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to check in."
            );
        }
    };

    // Check out
    const handleCheckOut = async (id) => {
        if (!window.confirm("Are you sure you want to check out?")) {
            return;
        }

        try {
            const response = await API.post(
                `/reservations/${id}/check-out`
            );

            alert(
                `Check-out successful!\nAdditional charge: ₹${response.data.additionalCharge}`
            );

            fetchReservations();

        } catch (error) {
            alert(
                error.response?.data?.message ||
                "Unable to check out."
            );
        }
    };

    if (loading) {
        return <p className="page-message">Loading reservations...</p>;
    }

    if (error) {
        return <p className="page-message error">{error}</p>;
    }

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>My Reservations</h1>
                <p>View and manage your parking bookings.</p>
            </div>

            {reservations.length === 0 ? (
                <p>You haven't made any reservations yet.</p>
            ) : (

                <div className="reservations-list">

                    {reservations.map((reservation) => (

                        <div
                            className="reservation-card"
                            key={reservation.reservation_id}
                        >

                            <div className="reservation-header">
                                <h2>{reservation.parking_lot}</h2>

                                <span className={`status ${reservation.status.toLowerCase()}`}>
                                    {reservation.status}
                                </span>
                            </div>

                            <div className="reservation-details">

                                <p>
                                    <strong>Reservation ID:</strong>{" "}
                                    {reservation.reservation_id}
                                </p>

                                <p>
                                    <strong>Address:</strong>{" "}
                                    {reservation.address}, {reservation.city}
                                </p>

                                <p>
                                    <strong>Vehicle:</strong>{" "}
                                    {reservation.registration_number}
                                </p>

                                <p>
                                    <strong>Space:</strong>{" "}
                                    {reservation.space_number}
                                </p>

                                <p>
                                    <strong>Space Type:</strong>{" "}
                                    {reservation.space_type}
                                </p>

                                <p>
                                    <strong>Start:</strong>{" "}
                                    {new Date(reservation.starts_at).toLocaleString()}
                                </p>

                                <p>
                                    <strong>End:</strong>{" "}
                                    {new Date(reservation.ends_at).toLocaleString()}
                                </p>

                            </div>

                            <div className="reservation-actions">

                                {reservation.status === "CONFIRMED" && (
                                    <>
                                        <button
                                            className="cancel-btn"
                                            onClick={() =>
                                                handleCancel(reservation.reservation_id)
                                            }
                                        >
                                            Cancel
                                        </button>

                                        <button
                                            onClick={() =>
                                                handleCheckIn(reservation.reservation_id)
                                            }
                                        >
                                            Check In
                                        </button>
                                    </>
                                )}

                                {reservation.status === "CHECKED_IN" && (
                                    <button
                                        onClick={() =>
                                            handleCheckOut(reservation.reservation_id)
                                        }
                                    >
                                        Check Out
                                    </button>
                                )}

                            </div>

                        </div>

                    ))}

                </div>
            )}

        </div>
    );
}

export default MyReservations;
