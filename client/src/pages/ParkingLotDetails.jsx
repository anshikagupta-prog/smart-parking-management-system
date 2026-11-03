
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";

function ParkingLotDetails() {
    const { lotId } = useParams();
    const navigate = useNavigate();

    const [lot, setLot] = useState(null);
    const [spaces, setSpaces] = useState([]);

    const [startsAt, setStartsAt] = useState("");
    const [endsAt, setEndsAt] = useState("");
    const [spaceType, setSpaceType] = useState("");

    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState("");

    // Fetch parking lot details
    useEffect(() => {
        const fetchLot = async () => {
            try {
                const response = await API.get(`/parking-lots/${lotId}`);
                setLot(response.data.parkingLot);
            } catch (error) {
                setError("Unable to fetch parking lot details");
            } finally {
                setLoading(false);
            }
        };

        fetchLot();
    }, [lotId]);

    // Search available spaces
    const handleSearch = async (e) => {
        e.preventDefault();

        setError("");
        setSpaces([]);

        const start = new Date(startsAt);
        const end = new Date(endsAt);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            setError("Please select a valid time interval.");
            return;
        }

        setSearching(true);

        try {
            const response = await API.get("/availability", {
                params: {
                    lot_id: lotId,
                    starts_at: start.toISOString(),
                    ends_at: end.toISOString(),
                    ...(spaceType && { space_type: spaceType })
                }
            });

            setSpaces(response.data.parkingSpaces);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to search for available spaces"
            );
        } finally {
            setSearching(false);
        }
    };

    if (loading) {
        return <p className="page-message">Loading parking lot...</p>;
    }

    if (!lot) {
        return <p className="page-message">Parking lot not found.</p>;
    }

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>{lot.name}</h1>
                <p>{lot.address}, {lot.city}</p>
                <p>{lot.total_spaces} total parking spaces</p>
            </div>

            <div className="search-card">
                <h2>Find Available Spaces</h2>

                <form onSubmit={handleSearch}>

                    <div className="search-fields">

                        <div>
                            <label>Start Time</label>
                            <input
                                type="datetime-local"
                                value={startsAt}
                                onChange={(e) => setStartsAt(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>End Time</label>
                            <input
                                type="datetime-local"
                                value={endsAt}
                                onChange={(e) => setEndsAt(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label>Space Type</label>
                            <select
                                value={spaceType}
                                onChange={(e) => setSpaceType(e.target.value)}
                            >
                                <option value="">All Types</option>
                                <option value="REGULAR">Regular</option>
                                <option value="EV">EV</option>
                                <option value="HANDICAPPED">Handicapped</option>
                            </select>
                        </div>

                    </div>

                    <button type="submit" disabled={searching}>
                        {searching ? "Searching..." : "Search Availability"}
                    </button>

                </form>
            </div>

            {error && <p className="error">{error}</p>}

            <h2 className="section-heading">Available Spaces</h2>

            {!searching && spaces.length === 0 && !error && (
                <p>Select your time interval and search to see available spaces.</p>
            )}

            <div className="spaces-grid">

                {spaces.map((space) => (
                    <div className="space-card" key={space.space_id}>

                        <h3>Space {space.space_number}</h3>

                        <p>Type: {space.space_type}</p>
                        <p>Floor: {space.floor_number}</p>

                        <span className="available-label">
                            Available
                        </span>

                        <button
                            onClick={() =>
                                navigate(
                                    `/book/${space.space_id}`,
                                    {
                                        state: {
                                            lot,
                                            space,
                                            startsAt,
                                            endsAt
                                        }
                                    }
                                )
                            }
                        >
                            Select Space
                        </button>

                    </div>
                ))}

            </div>

        </div>
    );
}

export default ParkingLotDetails;
