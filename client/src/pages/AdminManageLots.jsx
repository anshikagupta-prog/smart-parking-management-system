
import { useEffect, useState } from "react";
import API from "../services/api";

const AdminManageLots = () => {
    const [lots, setLots] = useState([]);
    const [form, setForm] = useState({
        name: "",
        address: "",
        city: ""
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const fetchLots = async () => {
        try {
            const response = await API.get("/parking-lots");
            setLots(response.data.parkingLots);
        } catch (err) {
            setError("Could not fetch parking lots.");
        }
    };

    useEffect(() => {
        fetchLots();
    }, []);

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

        try {
            if (editingId) {
                await API.put(`/parking-lots/${editingId}`, form);
                setMessage("Parking lot updated successfully.");
            } else {
                await API.post("/parking-lots", form);
                setMessage("Parking lot added successfully.");
            }

            setForm({ name: "", address: "", city: "" });
            setEditingId(null);
            fetchLots();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed.");
        }
    };

    const handleEdit = (lot) => {
        setForm({
            name: lot.name,
            address: lot.address,
            city: lot.city
        });
        setEditingId(lot.id);
        setError("");
        setMessage("");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this parking lot?")) {
            return;
        }

        setError("");
        setMessage("");

        try {
            await API.delete(`/parking-lots/${id}`);
            setMessage("Parking lot deleted successfully.");
            fetchLots();
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Could not delete this parking lot. It may contain parking spaces."
            );
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ name: "", address: "", city: "" });
        setError("");
        setMessage("");
    };

    return (
        <div className="admin-page">
            <h1>Manage Parking Lots</h1>
            <p>Add and manage parking locations.</p>

            <form className="admin-form" onSubmit={handleSubmit}>
                <h2>{editingId ? "Edit Parking Lot" : "Add New Parking Lot"}</h2>

                <input
                    type="text"
                    name="name"
                    placeholder="Parking lot name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="address"
                    placeholder="Address"
                    value={form.address}
                    onChange={handleChange}
                    required
                />

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={form.city}
                    onChange={handleChange}
                    required
                />

                <button type="submit">
                    {editingId ? "Update Lot" : "Add Lot"}
                </button>

                {editingId && (
                    <button type="button" onClick={cancelEdit}>
                        Cancel
                    </button>
                )}
            </form>

            {error && <p className="error-message">{error}</p>}
            {message && <p className="success-message">{message}</p>}

            <div className="admin-lot-list">
                <h2>Existing Parking Lots</h2>

                {lots.length === 0 ? (
                    <p>No parking lots found.</p>
                ) : (
                    lots.map((lot) => (
                        <div className="admin-lot-card" key={lot.id}>
                            <div>
                                <h3>{lot.name}</h3>
                                <p>{lot.address}, {lot.city}</p>
                                <p>Total spaces: {lot.total_spaces}</p>
                            </div>

                            <div className="admin-lot-actions">
                                <button onClick={() => handleEdit(lot)}>
                                    Edit
                                </button>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDelete(lot.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminManageLots;
