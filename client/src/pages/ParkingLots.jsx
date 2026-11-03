
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function ParkingLots() {
    const [lots, setLots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    useEffect(() => {
        const fetchLots = async () => {
            try {
                const response = await API.get("/parking-lots");
                setLots(response.data.parkingLots);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    "Unable to fetch parking lots"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchLots();
    }, []);

    if (loading) {
        return <p className="page-message">Loading parking lots...</p>;
    }

    if (error) {
        return <p className="page-message error">{error}</p>;
    }

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>Find Parking</h1>
                <p>Explore available parking locations.</p>
            </div>

            {lots.length === 0 ? (
                <p>No parking lots are currently available.</p>
            ) : (
                <div className="lots-grid">

                    {lots.map((lot) => (
                        <div className="lot-card" key={lot.id}>

                            <div className="lot-icon">
                                P
                            </div>

                            <h2>{lot.name}</h2>

                            <p>{lot.address}</p>

                            <p className="lot-city">
                                {lot.city}
                            </p>

                            <div className="lot-details">
                                <span>
                                    {lot.total_spaces} Parking Spaces
                                </span>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(`/parking-lots/${lot.id}`)
                                }
                            >
                                View Spaces
                            </button>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default ParkingLots;
