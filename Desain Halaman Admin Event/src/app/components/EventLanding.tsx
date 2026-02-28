import { useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Award,
  ChevronRight,
} from "lucide-react";
import { mockEvents, defaultFormFields } from "../data/mockData";

export default function EventLanding() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  const upcomingEvents = mockEvents.filter((e) => e.status === "upcoming");
  const featuredEvent = upcomingEvents[0];

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Pendaftaran berhasil! Kami akan mengirimkan konfirmasi ke email Anda.");
    setShowRegistrationForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Event Manager
              </h1>
              <p className="text-sm text-gray-600">
                Platform Pendaftaran Event
              </p>
            </div>
            <Link
              to="/admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {featuredEvent && (
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm mb-4">
                  {featuredEvent.category}
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mb-4">
                  {featuredEvent.title}
                </h2>
                <p className="text-lg text-blue-100 mb-6">
                  {featuredEvent.description}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>
                      {new Date(featuredEvent.date).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{featuredEvent.time} WIB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {featuredEvent.type === "online" ? (
                      <>
                        <Video className="w-5 h-5" />
                        <span>Online via Zoom</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        <span>{featuredEvent.location}</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEvent(featuredEvent.id);
                    setShowRegistrationForm(true);
                  }}
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-lg flex items-center gap-2"
                >
                  Daftar Sekarang
                  <ChevronRight className="w-5 h-5" />
                </button>

                <p className="mt-4 text-sm text-blue-100">
                  🎟️ {featuredEvent.registeredCount}/
                  {featuredEvent.maxParticipants} peserta terdaftar
                </p>
              </div>

              <div>
                <img
                  src={featuredEvent.image}
                  alt={featuredEvent.title}
                  className="rounded-xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Events Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Event Mendatang
          </h2>
          <p className="text-gray-600">
            Jelajahi event menarik yang bisa Anda ikuti
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full mb-3">
                  {event.category}
                </span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    {new Date(event.date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {event.time} WIB
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {event.type === "online" ? (
                      <>
                        <Video className="w-4 h-4" />
                        Online
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Pendaftar</span>
                    <span className="font-semibold text-gray-900">
                      {event.registeredCount}/{event.maxParticipants}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          (event.registeredCount / event.maxParticipants) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedEvent(event.id);
                    setShowRegistrationForm(true);
                  }}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Daftar Sekarang
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Kenapa Mengikuti Event Kami?
            </h2>
            <p className="text-gray-600">
              Dapatkan pengalaman dan manfaat terbaik dari setiap event
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Networking
              </h3>
              <p className="text-gray-600">
                Bertemu dan berkolaborasi dengan profesional di bidangnya
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                E-Sertifikat
              </h3>
              <p className="text-gray-600">
                Dapatkan sertifikat digital untuk setiap event yang diikuti
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fleksibel
              </h3>
              <p className="text-gray-600">
                Ikuti event secara online atau offline sesuai preferensi Anda
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Registration Modal */}
      {showRegistrationForm && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Form Pendaftaran
              </h2>
              <p className="text-gray-600 mt-1">
                {mockEvents.find((e) => e.id === selectedEvent)?.title}
              </p>
            </div>

            <form onSubmit={handleRegister} className="p-6 space-y-4">
              {defaultFormFields.map((field) => (
                <div key={field.id}>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {field.label}
                    {field.required && (
                      <span className="text-red-600 ml-1">*</span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Daftar
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegistrationForm(false)}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Event Manager</h3>
          <p className="text-gray-400 mb-4">
            Platform Manajemen Event Terpadu
          </p>
          <p className="text-sm text-gray-500">
            © 2026 Event Manager. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
