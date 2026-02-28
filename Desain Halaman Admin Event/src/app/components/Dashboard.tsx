import { Link } from "react-router";
import {
  Calendar,
  Users,
  Award,
  TrendingUp,
  CalendarClock,
  CalendarCheck,
  Video,
  MapPin,
} from "lucide-react";
import { mockEvents, mockParticipants } from "../data/mockData";

export default function Dashboard() {
  const upcomingEvents = mockEvents.filter((e) => e.status === "upcoming");
  const pastEvents = mockEvents.filter((e) => e.status === "past");
  const totalParticipants = mockParticipants.length;
  const certificatesIssued = mockParticipants.filter((p) => p.certificateIssued).length;

  const stats = [
    {
      label: "Event Mendatang",
      value: upcomingEvents.length,
      icon: CalendarClock,
      color: "bg-blue-500",
      link: "/admin/events/upcoming",
    },
    {
      label: "Event Selesai",
      value: pastEvents.length,
      icon: CalendarCheck,
      color: "bg-green-500",
      link: "/admin/events/past",
    },
    {
      label: "Total Peserta",
      value: totalParticipants,
      icon: Users,
      color: "bg-purple-500",
      link: "/admin/events/upcoming",
    },
    {
      label: "Sertifikat Terbit",
      value: certificatesIssued,
      icon: Award,
      color: "bg-orange-500",
      link: "/admin/certificates",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Selamat datang di panel admin Event Manager
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Event Mendatang</h2>
          <Link
            to="/admin/events/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buat Event Baru
          </Link>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
            >
              <img
                src={event.image}
                alt={event.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(event.date).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  • {event.time}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
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
                        Offline
                      </>
                    )}
                  </span>
                  <span className="text-sm text-gray-600">
                    {event.registeredCount}/{event.maxParticipants} peserta
                  </span>
                </div>
              </div>
              <Link
                to={`/admin/participants/${event.id}`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Kelola
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/forms"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Kelola Form Pendaftaran
          </h3>
          <p className="text-sm text-gray-600">
            Atur pertanyaan dan field untuk formulir pendaftaran event
          </p>
        </Link>

        <Link
          to="/admin/certificates"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Kelola E-Sertifikat
          </h3>
          <p className="text-sm text-gray-600">
            Buat dan kelola template sertifikat untuk peserta event
          </p>
        </Link>

        <Link
          to="/"
          className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">
            Lihat Landing Page
          </h3>
          <p className="text-sm text-gray-600">
            Preview halaman publik untuk pendaftaran event
          </p>
        </Link>
      </div>
    </div>
  );
}
