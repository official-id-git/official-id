import { useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Filter,
  Download,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Video,
} from "lucide-react";
import { mockEvents, mockParticipants, Participant } from "../data/mockData";

export default function AllParticipants() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = mockParticipants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm);
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    const matchesEvent = filterEvent === "all" || p.eventId === filterEvent;
    return matchesSearch && matchesStatus && matchesEvent;
  });

  const getEventTitle = (eventId: string) => {
    return mockEvents.find((e) => e.id === eventId)?.title || "Event";
  };

  const getEventInfo = (eventId: string) => {
    return mockEvents.find((e) => e.id === eventId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Terkonfirmasi";
      case "cancelled":
        return "Dibatalkan";
      default:
        return "Pending";
    }
  };

  // Statistics
  const totalParticipants = mockParticipants.length;
  const confirmedCount = mockParticipants.filter((p) => p.status === "confirmed").length;
  const pendingCount = mockParticipants.filter((p) => p.status === "pending").length;
  const cancelledCount = mockParticipants.filter((p) => p.status === "cancelled").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Daftar Pendaftar</h1>
        <p className="text-gray-600 mt-2">
          Kelola semua pendaftar dari seluruh event
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendaftar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalParticipants}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Terkonfirmasi</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {confirmedCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {pendingCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dibatalkan</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {cancelledCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, email, atau telepon..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Semua Event</option>
                {mockEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua Status</option>
              <option value="confirmed">Terkonfirmasi</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Mail className="w-4 h-4" />
            Kirim Email Massal
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredParticipants.length} dari {totalParticipants}{" "}
            pendaftar
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredParticipants.map((participant) => {
            const event = getEventInfo(participant.eventId);
            return (
              <div
                key={participant.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-blue-600">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {participant.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(participant.status)}
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(
                                participant.status
                              )}`}
                            >
                              {getStatusText(participant.status)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {participant.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {participant.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Daftar:{" "}
                            {new Date(
                              participant.registrationDate
                            ).toLocaleDateString("id-ID")}
                          </div>
                          {participant.certificateIssued && (
                            <div className="flex items-center gap-2 text-green-600">
                              <Award className="w-4 h-4" />
                              Sertifikat Terbit
                            </div>
                          )}
                        </div>

                        {event && (
                          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm">
                              {event.type === "online" ? (
                                <Video className="w-4 h-4 text-blue-600" />
                              ) : (
                                <MapPin className="w-4 h-4 text-green-600" />
                              )}
                              <span className="font-semibold text-gray-900">
                                {event.title}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-600">
                                {new Date(event.date).toLocaleDateString(
                                  "id-ID",
                                  { day: "numeric", month: "short" }
                                )}{" "}
                                • {event.time}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedParticipant(participant)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      <Eye className="w-4 h-4" />
                      Detail
                    </button>
                    <Link
                      to={`/admin/participants/${participant.eventId}`}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                    >
                      Lihat Event
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredParticipants.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <p>Tidak ada pendaftar ditemukan</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedParticipant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Detail Pendaftar
                </h2>
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedParticipant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedParticipant.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedParticipant.status)}
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(
                        selectedParticipant.status
                      )}`}
                    >
                      {getStatusText(selectedParticipant.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Informasi Kontak
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedParticipant.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Telepon:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedParticipant.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Informasi Event
                  </h4>
                  {(() => {
                    const event = getEventInfo(selectedParticipant.eventId);
                    if (!event) return null;
                    return (
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-900">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(event.date).toLocaleDateString("id-ID", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          • {event.time} WIB
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {event.type === "online" ? (
                            <>
                              <Video className="w-4 h-4" />
                              Online via Zoom
                            </>
                          ) : (
                            <>
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Status Pendaftaran
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tanggal Daftar:</span>
                      <span className="font-semibold text-gray-900">
                        {new Date(
                          selectedParticipant.registrationDate
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">E-Sertifikat:</span>
                      <span
                        className={`font-semibold ${
                          selectedParticipant.certificateIssued
                            ? "text-green-600"
                            : "text-gray-900"
                        }`}
                      >
                        {selectedParticipant.certificateIssued
                          ? "Sudah Terbit"
                          : "Belum Terbit"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                {selectedParticipant.status === "pending" && (
                  <button className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    Konfirmasi
                  </button>
                )}
                {!selectedParticipant.certificateIssued && (
                  <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <Award className="w-4 h-4 inline mr-2" />
                    Terbitkan Sertifikat
                  </button>
                )}
                <button className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Kirim Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
