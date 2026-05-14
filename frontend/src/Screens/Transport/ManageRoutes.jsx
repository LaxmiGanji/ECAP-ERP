import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { baseApiURL } from "../../baseUrl";

const defaultStop = () => ({
  name: "",
  landmark: "",
  distanceKm: "",
  fare: "",
  arrivalTime: "",
});

const initialFormState = {
  busNumber: "",
  busName: "",
  driverName: "",
  driverPhone: "",
  capacity: 40,
  routeName: "",
  description: "",
  baseFare: 0,
  status: "active",
  stops: [defaultStop()],
};

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialFormState);
  const [editingId, setEditingId] = useState(null);

  const headers = useMemo(() => ({ "Content-Type": "application/json" }), []);

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${baseApiURL()}/transport/routes`, { headers });
      if (res.data.success) {
        setRoutes(res.data.routes || []);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Unable to load transport data.");
    } finally {
      setLoading(false);
    }
  };

  const updateFormField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateStopField = (index, field, value) => {
    setForm((prev) => {
      const updatedStops = [...prev.stops];
      updatedStops[index] = { ...updatedStops[index], [field]: value };
      return { ...prev, stops: updatedStops };
    });
  };

  const addStop = () => {
    setForm((prev) => ({ ...prev, stops: [...prev.stops, defaultStop()] }));
  };

  const removeStop = (index) => {
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, idx) => idx !== index),
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      capacity: Number(form.capacity),
      baseFare: Number(form.baseFare),
      stops: form.stops.map((stop) => ({
        ...stop,
        distanceKm: stop.distanceKm === "" ? "" : Number(stop.distanceKm),
        fare: stop.fare === "" ? "" : Number(stop.fare),
      })),
    };

    try {
      const url = `${baseApiURL()}/transport/routes${editingId ? `/${editingId}` : ""}`;
      const method = editingId ? axios.put : axios.post;
      const res = await method(url, payload, { headers });
      if (res.data.success) {
        toast.success(res.data.message);
        resetForm();
        fetchRoutes();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Unable to save data.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (route) => {
    setEditingId(route._id);
    setForm({
      busNumber: route.busNumber,
      busName: route.busName,
      driverName: route.driverName || "",
      driverPhone: route.driverPhone || "",
      capacity: route.capacity,
      routeName: route.routeName,
      description: route.description || "",
      baseFare: route.baseFare,
      status: route.status,
      stops: route.stops.length ? route.stops : [defaultStop()],
    });
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm("Delete this route? This cannot be undone.")) {
      return;
    }
    try {
      const res = await axios.delete(`${baseApiURL()}/transport/routes/${routeId}`, { headers });
      if (res.data.success) {
        toast.success("Route deleted.");
        fetchRoutes();
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Unable to delete route.");
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Transport Management</h1>
        <p className="text-gray-600">
          Add buses, define routes with stops/stations, and publish fares for students.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {editingId ? "Update Transport Route" : "Create New Transport Route"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm text-blue-600 hover:underline"
              >
                Cancel edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              required
              value={form.busNumber}
              onChange={(e) => updateFormField("busNumber", e.target.value)}
              placeholder="Bus Number"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              required
              value={form.busName}
              onChange={(e) => updateFormField("busName", e.target.value)}
              placeholder="Bus / Service Name"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              value={form.driverName}
              onChange={(e) => updateFormField("driverName", e.target.value)}
              placeholder="Driver Name"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              value={form.driverPhone}
              onChange={(e) => updateFormField("driverPhone", e.target.value)}
              placeholder="Driver Contact"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => updateFormField("capacity", e.target.value)}
              placeholder="Total Seats"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              required
              value={form.routeName}
              onChange={(e) => updateFormField("routeName", e.target.value)}
              placeholder="Route Name"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="number"
              min="0"
              value={form.baseFare}
              onChange={(e) => updateFormField("baseFare", e.target.value)}
              placeholder="Base Fare"
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <select
              value={form.status}
              onChange={(e) => updateFormField("status", e.target.value)}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <textarea
            value={form.description}
            onChange={(e) => updateFormField("description", e.target.value)}
            placeholder="Notes or description for this route"
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            rows={3}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Stops & Pricing</h3>
              <button
                type="button"
                onClick={addStop}
                className="text-sm text-blue-600 hover:underline"
              >
                + Add Stop
              </button>
            </div>

            {form.stops.map((stop, index) => (
              <div key={index} className="border rounded-xl p-4 space-y-3 bg-gray-50">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">Stop #{index + 1}</span>
                  {form.stops.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeStop(index)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    required
                    value={stop.name}
                    onChange={(e) => updateStopField(index, "name", e.target.value)}
                    placeholder="Stop Name"
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    value={stop.landmark || ""}
                    onChange={(e) => updateStopField(index, "landmark", e.target.value)}
                    placeholder="Landmark / Station"
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    min="0"
                    value={stop.distanceKm}
                    onChange={(e) => updateStopField(index, "distanceKm", e.target.value)}
                    placeholder="Distance (km)"
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <input
                    type="number"
                    min="0"
                    value={stop.fare}
                    onChange={(e) => updateStopField(index, "fare", e.target.value)}
                    placeholder="Fare (optional)"
                    className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <input
                  value={stop.arrivalTime || ""}
                  onChange={(e) => updateStopField(index, "arrivalTime", e.target.value)}
                  placeholder="Arrival Time (e.g. 7:45 AM)"
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-blue-700 transition disabled:opacity-60"
          >
            {saving ? "Saving..." : editingId ? "Update Route" : "Save Route"}
          </button>
        </form>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Published Routes</h2>
              <p className="text-sm text-gray-500">Overview of buses and stops visible to students.</p>
            </div>
            <button
              type="button"
              onClick={fetchRoutes}
              className="text-sm text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading routes...</p>
          ) : !routes.length ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed rounded-xl">
              No routes added yet. Create one using the form.
            </div>
          ) : (
            <div className="space-y-4">
              {routes.map((route) => {
                const occupied = route.allocatedSeats || 0;
                const seatsLeft = Math.max(route.capacity - occupied, 0);
                return (
                  <div key={route._id} className="border rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {route.routeName} • {route.busNumber}
                        </h3>
                        <p className="text-sm text-gray-500">{route.busName}</p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          route.status === "active"
                            ? "bg-green-100 text-green-700"
                            : route.status === "maintenance"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {route.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Seats</p>
                        <p className="font-semibold">
                          {occupied}/{route.capacity}{" "}
                          <span className="text-xs text-gray-500">(Left: {seatsLeft})</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Base Fare</p>
                        <p className="font-semibold">₹{route.baseFare}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stops</p>
                        <p className="font-semibold">{route.stops.length}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Driver</p>
                        <p className="font-semibold">{route.driverName || "NA"}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                      {route.stops.map((stop) => (
                        <div key={stop.code || stop.name} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="font-medium text-gray-800">{stop.name}</p>
                            {stop.landmark && <p className="text-gray-500 text-xs">{stop.landmark}</p>}
                          </div>
                          <div className="text-right">
                            {typeof stop.fare === "number" && (
                              <p className="text-gray-800 font-semibold">₹{stop.fare}</p>
                            )}
                            {stop.distanceKm && (
                              <p className="text-gray-500 text-xs">{stop.distanceKm} km</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(route)}
                        className="px-4 py-2 rounded-lg border text-sm font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(route._id)}
                        className="px-4 py-2 rounded-lg border text-sm font-medium text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageRoutes;

