
import { useEffect, useState } from "react";
import API from "../services/api";

const AdminManageSpaces = () => {
    const [lots, setLots] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [selectedLot, setSelectedLot] = useState("");

    const [form, setForm] = useState({
        space_number: "",
        space_type: "REGULAR",
        floor_number: 0,
        status: "AVAILABLE"
    });

    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    useEffect(() => {
        fetchLots();
    }, []);

    const fetchLots = async () => {
        try {
            const response = await API.get("/parking-lots");
            setLots(response.data.parkingLots);
        } catch (err) {
            setError("Could not fetch parking lots.");
        }
    };

    const fetchSpaces = async (lotId) => {
        try {
            const response = await API.get(`/parking-spaces/lot/${lotId}`);
            setSpaces(response.data.parkingSpaces);
        } catch (err) {
            setError("Could not fetch parking spaces.");
        }
    };

    const handleLotChange = (e) => {
        const lotId = e.target.value;
        setSelectedLot(lotId);
        setSpaces([]);
        setEditingId(null);
        setForm({
            space_number: "",
            space_type: "REGULAR",
            floor_number: 0,
            status: "AVAILABLE"
        });
        setError("");
        setMessage("");

        if (lotId) fetchSpaces(lotId);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!selectedLot) {
            setError("Please select a parking lot.");
            return;
        }

        const data = {
            ...form,
            lot_id: Number(selectedLot),
            floor_number: Number(form.floor_number)
        };

        try {
            if (editingId) {
                await API.put(`/parking-spaces/${editingId}`, data);
                setMessage("Parking space updated successfully.");
            } else {
                await API.post("/parking-spaces", data);
                setMessage("Parking space added successfully.");
            }

            setForm({
                space_number: "",
                space_type: "REGULAR",
                floor_number: 0,
                status: "AVAILABLE"
            });

            setEditingId(null);
            fetchSpaces(selectedLot);
            fetchLots();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed.");
        }
    };

    const handleEdit = (space) => {
        setForm({
            space_number: space.space_number,
            space_type: space.space_type,
            floor_number: space.floor_number,
            status: space.status
        });

        setEditingId(space.id);
        setError("");
        setMessage("");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this parking space?")) return;

        setError("");
        setMessage("");

        try {
            await API.delete(`/parking-spaces/${id}`);
            setMessage("Parking space deleted successfully.");
            fetchSpaces(selectedLot);
            fetchLots();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete this space. It may have reservations."
            );
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            space_number: "",
            space_type: "REGULAR",
            floor_number: 0,
            status: "AVAILABLE"
        });
        setError("");
        setMessage("");
    };

    return (
        <div className="admin-page">
            <h1>Manage Parking Spaces</h1>
            <p>Add and manage spaces within each parking lot.</p>

            <div className="admin-form">
                <h2>Select Parking Lot</h2>

                <select value={selectedLot} onChange={handleLotChange}>
                    <option value="">Select a parking lot</option>
                    {lots.map((lot) => (
                        <option key={lot.id} value={lot.id}>
                            {lot.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedLot && (
                <>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <h2>{editingId ? "Edit Space" : "Add New Space"}</h2>

                        <input
                            name="space_number"
                            placeholder="Space number (e.g. A1)"
                            value={form.space_number}
                            onChange={handleChange}
                            required
                        />

                        <select
                            name="space_type"
                            value={form.space_type}
                            onChange={handleChange}
                        >
                            <option value="REGULAR">Regular</option>
                            <option value="EV">EV</option>
                            <option value="HANDICAPPED">Handicapped</option>
                        </select>

                        <input
                            type="number"
                            name="floor_number"
                            placeholder="Floor number"
                            value={form.floor_number}
                            onChange={handleChange}
                            required
                        />

                        {editingId && (
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="MAINTENANCE">Maintenance</option>
                            </select>
                        )}

                        <button type="submit">
                            {editingId ? "Update Space" : "Add Space"}
                        </button>

                        {editingId && (
                            <button type="button" onClick={cancelEdit}>
                                Cancel
                            </button>
                        )}
                    </form>

                    <div className="admin-lot-list">
                        <h2>Parking Spaces</h2>

                        {spaces.length === 0 ? (
                            <p>No spaces added to this lot yet.</p>
                        ) : (
                            spaces.map((space) => (
                                <div className="admin-lot-card" key={space.id}>
                                    <div>
                                        <h3>Space {space.space_number}</h3>
                                        <p>Type: {space.space_type}</p>
                                        <p>Floor: {space.floor_number}</p>
                                        <p>Status: {space.status}</p>
                                    </div>

                                    <div className="admin-lot-actions">
                                        <button onClick={() => handleEdit(space)}>
                                            Edit
                                        </button>

                                        <button
                                            className="delete-button"
                                            onClick={() => handleDelete(space.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            )}

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}
        </div>
    );
};

export default AdminManageSpaces;
