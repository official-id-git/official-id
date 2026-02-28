import { Link, useLocation } from "react-router";
import { Edit, Trash2, Users, Video, MapPin, ExternalLink } from "lucide-react";
import { mockEvents } from "../data/mockData";

export default function EventList() {
  const location = useLocation();
  const isPastEvents = location.pathname.includes("past");
  
  const events = mockEvents.filter((e) =>
    isPastEvents ? e.status === "past" : e.status === "upcoming"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {isPastEvents ? "Event Selesai" : "Event Mendatang"}
        </h1>
        <p className="text-gray-600 mt-2">
          {isPastEvents
            ? "Daftar event yang sudah dilaksanakan"
            : "Daftar event yang akan dilaksanakan"}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Total: {events.length} Event
          </h2>
          {!isPastEvents && (
            <Link
              to="/admin/events/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Buat Event Baru
            </Link>
          )}
        </div>

        <div className="divide-y divide-gray-200">
          {events.map((event) => (
            <div key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex gap-4">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-32 h-32 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {event.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {event.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    <span>
                      📅{" "}
                      {new Date(event.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <span>🕐 {event.time}</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded ${
                        event.type === "online"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {event.type === "online" ? (
                        <>
                          <Video className="w-3 h-3" />
                          Online
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
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
                              (event.registeredCount / event.maxParticipants) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {event.type === "online" && event.zoomLink && (
                        <a
                          href={event.zoomLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Buka Zoom"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      )}
                      {event.type === "offline" && event.googleMapUrl && (
                        <a
                          href={event.googleMapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Buka Google Maps"
                        >
                          <MapPin className="w-5 h-5" />
                        </a>
                      )}
                      <Link
                        to={`/admin/participants/${event.id}`}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Kelola Peserta"
                      >
                        <Users className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/admin/events/edit/${event.id}`}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada event {isPastEvents ? "selesai" : "mendatang"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
