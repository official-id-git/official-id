import { useState } from "react";
import { useParams, Link } from "react-router";
import {
  ArrowLeft,
  Search,
  Download,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Mail,
  Eye,
  UserPlus,
  BarChart3,
} from "lucide-react";
import { mockEvents, mockParticipants, Participant } from "../data/mockData";

export default function ManageParticipants() {
  const { eventId } = useParams();
  const event = mockEvents.find((e) => e.id === eventId);
  const participants = mockParticipants.filter((p) => p.eventId === eventId);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

  const filteredParticipants = participants.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
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

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Event tidak ditemukan</p>
      </div>
    );
  }

  // Statistics
  const confirmedCount = participants.filter((p) => p.status === "confirmed").length;
  const pendingCount = participants.filter((p) => p.status === "pending").length;
  const cancelledCount = participants.filter((p) => p.status === "cancelled").length;
  const certificatesIssuedCount = participants.filter((p) => p.certificateIssued).length;

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/events/upcoming"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Event
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Kelola Peserta</h1>
        <p className="text-gray-600 mt-2">{event.title}</p>
      </div>

      {/* Event Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center gap-6">
          <img
            src={event.image}
            alt={event.title}
            className="w-32 h-32 object-cover rounded-lg shadow-lg"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">
              {event.title}
            </h2>
            <p className="text-blue-100 mb-4">
              {new Date(event.date).toLocaleDateString("id-ID", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              • {event.time} WIB
            </p>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-sm text-blue-100">Kapasitas</p>
                <p className="text-2xl font-bold">
                  {event.registeredCount}/{event.maxParticipants}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-100">Terkonfirmasi</p>
                <p className="text-2xl font-bold">{confirmedCount}</p>
              </div>
              <div>
                <p className="text-sm text-blue-100">Sertifikat Terbit</p>
                <p className="text-2xl font-bold">{certificatesIssuedCount}</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-white bg-opacity-20 rounded-lg p-4">
              <BarChart3 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">
                {Math.round((event.registeredCount / event.maxParticipants) * 100)}%
              </p>
              <p className="text-xs text-blue-100">Terisi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pendaftar</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {participants.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-600" />
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

      {/* Actions Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari peserta..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="all">Semua Status</option>
                <option value="confirmed">Terkonfirmasi</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Dibatalkan</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 md:flex-none justify-center">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex-1 md:flex-none justify-center">
              <Award className="w-5 h-5" />
              Terbitkan Sertifikat
            </button>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredParticipants.length} dari {participants.length} peserta
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredParticipants.map((participant) => (
            <div
              key={participant.id}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-blue-600">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {participant.name}
                    </h3>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(participant.status)}
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${getStatusBadge(
                          participant.status
                        )}`}
                      >
                        {getStatusText(participant.status)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{participant.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      Daftar: {new Date(participant.registrationDate).toLocaleDateString("id-ID")}
                    </div>
                    <div className="flex items-center gap-2">
                      {participant.certificateIssued ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <Award className="w-4 h-4" />
                          Sertifikat Terbit
                        </span>
                      ) : (
                        <span className="text-gray-400">Belum ada sertifikat</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedParticipant(participant)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {!participant.certificateIssued && (
                    <button
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Terbitkan Sertifikat"
                    >
                      <Award className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Kirim Email"
                  >
                    <Mail className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredParticipants.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada peserta ditemukan</p>
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
                  Detail Peserta
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
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Telepon:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedParticipant.phone}
                      </span>
                    </div>
                  </div>
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