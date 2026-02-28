import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { ArrowLeft, Save, Video, MapPin, Upload } from "lucide-react";
import { mockEvents } from "../data/mockData";

export default function CreateEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!eventId;

  const existingEvent = isEdit
    ? mockEvents.find((e) => e.id === eventId)
    : null;

  const [formData, setFormData] = useState({
    title: existingEvent?.title || "",
    description: existingEvent?.description || "",
    category: existingEvent?.category || "Workshop",
    date: existingEvent?.date || "",
    time: existingEvent?.time || "",
    type: existingEvent?.type || "online",
    maxParticipants: existingEvent?.maxParticipants || 100,
    location: existingEvent?.location || "",
    googleMapUrl: existingEvent?.googleMapUrl || "",
    zoomLink: existingEvent?.zoomLink || "",
    image: existingEvent?.image || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    alert(
      isEdit
        ? "Event berhasil diperbarui!"
        : "Event baru berhasil dibuat!"
    );
    navigate("/admin/events/upcoming");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/events/upcoming"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {isEdit ? "Edit Event" : "Buat Event Baru"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isEdit
            ? "Perbarui informasi event Anda"
            : "Isi informasi untuk membuat event baru"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Judul Event *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Workshop Digital Marketing 2026"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Deskripsi *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Jelaskan tentang event Anda..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Kategori *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Pelatihan">Pelatihan</option>
                <option value="Talkshow">Talkshow</option>
                <option value="Webinar">Webinar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Max Peserta *
              </label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Tanggal *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Waktu *
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Tipe Event *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "online" }))
                }
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.type === "online"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Video
                  className={`w-6 h-6 mx-auto mb-2 ${
                    formData.type === "online"
                      ? "text-blue-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    formData.type === "online"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  Online
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, type: "offline" }))
                }
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.type === "offline"
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <MapPin
                  className={`w-6 h-6 mx-auto mb-2 ${
                    formData.type === "offline"
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`font-semibold ${
                    formData.type === "offline"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  Offline
                </p>
              </button>
            </div>
          </div>

          {/* Conditional Fields */}
          {formData.type === "online" && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Link Zoom *
              </label>
              <input
                type="url"
                name="zoomLink"
                value={formData.zoomLink}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://zoom.us/j/123456789"
              />
            </div>
          )}

          {formData.type === "offline" && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Lokasi *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Contoh: Gedung Serbaguna, Jakarta Pusat"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Google Maps URL
                </label>
                <input
                  type="url"
                  name="googleMapUrl"
                  value={formData.googleMapUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
            </>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              URL Gambar Event
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
            />
            {formData.image && (
              <img
                src={formData.image}
                alt="Preview"
                className="mt-4 w-full max-w-md h-48 object-cover rounded-lg"
              />
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4 mt-6">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            {isEdit ? "Simpan Perubahan" : "Buat Event"}
          </button>
          <Link
            to="/admin/events/upcoming"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}
