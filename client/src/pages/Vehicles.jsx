
import { useEffect, useState } from "react";
import API from "../services/api";

function Vehicles() {
    const [vehicles, setVehicles] = useState([]);
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [vehicleType, setVehicleType] = useState("CAR");
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Fetch registered vehicles
    const fetchVehicles = async () => {
        try {
            const response = await API.get("/vehicles");
            setVehicles(response.data.vehicles || []);
        } catch (error) {
            setError("Unable to fetch vehicles.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVehicles();
    }, []);

    // Add or update vehicle
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        const vehicleData = {
            registration_number: registrationNumber.trim().toUpperCase(),
            vehicle_type: vehicleType
        };

        try {
            if (editingId) {
                await API.put(`/vehicles/${editingId}`, vehicleData);
                setSuccess("Vehicle updated successfully!");
            } else {
                await API.post("/vehicles", vehicleData);
                setSuccess("Vehicle added successfully!");
            }

            setRegistrationNumber("");
            setVehicleType("CAR");
            setEditingId(null);

            await fetchVehicles();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to save vehicle."
            );
        }
    };

    // Load vehicle details into the form
    const handleEdit = (vehicle) => {
        setEditingId(vehicle.id);
        setRegistrationNumber(vehicle.registration_number);
        setVehicleType(vehicle.vehicle_type);
        setError("");
        setSuccess("");
    };

    // Delete vehicle
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this vehicle?")) {
            return;
        }

        try {
            await API.delete(`/vehicles/${id}`);
            setSuccess("Vehicle deleted successfully!");
            await fetchVehicles();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete vehicle."
            );
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setRegistrationNumber("");
        setVehicleType("CAR");
        setError("");
        setSuccess("");
    };

    if (loading) {
        return <p className="page-message">Loading vehicles...</p>;
    }

    return (
        <div className="page-container">

            <div className="page-heading">
                <h1>My Vehicles</h1>
                <p>Register and manage your vehicles.</p>
            </div>

            <div className="vehicle-form-card">

                <h2>{editingId ? "Edit Vehicle" : "Add New Vehicle"}</h2>

                <form onSubmit={handleSubmit}>

                    <div>
                        <label>Registration Number</label>
                        <input
                            type="text"
                            placeholder="Example: DL01AB1234"
                            value={registrationNumber}
                            onChange={(e) =>
                                setRegistrationNumber(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label>Vehicle Type</label>
                        <select
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                        >
                            <option value="CAR">Car</option>
                            <option value="BIKE">Bike</option>
                            <option value="SUV">SUV</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="vehicle-form-actions">
                        <button type="submit">
                            {editingId ? "Update Vehicle" : "Add Vehicle"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>

                </form>

                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}

            </div>

            <h2 className="section-heading">Registered Vehicles</h2>

            {vehicles.length === 0 ? (
                <p>No vehicles registered yet.</p>
            ) : (

                <div className="vehicles-grid">

                    {vehicles.map((vehicle) => (
                        <div className="vehicle-card" key={vehicle.id}>

                            <h3>{vehicle.registration_number}</h3>

                            <p>Type: {vehicle.vehicle_type}</p>

                            <div className="vehicle-actions">
                                <button onClick={() => handleEdit(vehicle)}>
                                    Edit
                                </button>

                                <button
                                    className="cancel-btn"
                                    onClick={() => handleDelete(vehicle.id)}
                                >
                                    Delete
                                </button>
                            </div>

                        </div>
                    ))}

                </div>
            )}

        </div>
    );
}

export default Vehicles;
