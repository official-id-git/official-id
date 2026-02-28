import { useState } from "react";
import { Award, Plus, Edit, Trash2, Eye } from "lucide-react";
import { mockCertificates, mockEvents } from "../data/mockData";

export default function ManageCertificates() {
  const [certificates, setCertificates] = useState(mockCertificates);
  const [showPreview, setShowPreview] = useState<string | null>(null);

  const getEventTitle = (eventId: string) => {
    return mockEvents.find((e) => e.id === eventId)?.title || "Event";
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Kelola E-Sertifikat
        </h1>
        <p className="text-gray-600 mt-2">
          Buat dan kelola template sertifikat untuk peserta event
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Certificate List */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Template Sertifikat
              </h2>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-5 h-5" />
                Buat Template
              </button>
            </div>

            <div className="space-y-4">
              {certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {cert.templateName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {getEventTitle(cert.eventId)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: cert.backgroundColor }}
                        />
                        <span className="text-xs text-gray-600">
                          Background
                        </span>
                        <div
                          className="w-6 h-6 rounded border border-gray-300"
                          style={{ backgroundColor: cert.textColor }}
                        />
                        <span className="text-xs text-gray-600">Text</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setShowPreview(cert.id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Preview Sertifikat
            </h2>

            {showPreview ? (
              (() => {
                const cert = certificates.find((c) => c.id === showPreview);
                if (!cert) return null;
                return (
                  <div
                    className="aspect-[1.414/1] rounded-lg border-4 border-gray-300 p-8 flex flex-col items-center justify-center text-center"
                    style={{ backgroundColor: cert.backgroundColor }}
                  >
                    <Award
                      className="w-16 h-16 mb-4"
                      style={{ color: cert.textColor }}
                    />
                    <h3
                      className="text-2xl font-bold mb-2"
                      style={{
                        color: cert.textColor,
                        fontFamily: cert.fontFamily,
                      }}
                    >
                      SERTIFIKAT
                    </h3>
                    <p
                      className="text-sm mb-4"
                      style={{ color: cert.textColor }}
                    >
                      Diberikan kepada
                    </p>
                    <p
                      className="text-3xl font-bold mb-6"
                      style={{
                        color: cert.textColor,
                        fontFamily: cert.fontFamily,
                      }}
                    >
                      [Nama Peserta]
                    </p>
                    <p
                      className="text-sm max-w-md"
                      style={{ color: cert.textColor }}
                    >
                      Telah mengikuti dan menyelesaikan
                    </p>
                    <p
                      className="text-lg font-semibold mt-2"
                      style={{
                        color: cert.textColor,
                        fontFamily: cert.fontFamily,
                      }}
                    >
                      {getEventTitle(cert.eventId)}
                    </p>
                  </div>
                );
              })()
            ) : (
              <div className="aspect-[1.414/1] rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Pilih template untuk melihat preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Editor */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          Buat Template Baru
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Nama Template
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Contoh: Template Modern"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Event
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Pilih Event</option>
              {mockEvents.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Warna Background
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-gray-300"
                defaultValue="#1e3a8a"
              />
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="#1e3a8a"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Warna Teks
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                className="w-12 h-10 rounded border border-gray-300"
                defaultValue="#ffffff"
              />
              <input
                type="text"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                defaultValue="#ffffff"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Font Family
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans Serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Simpan Template
          </button>
        </div>
      </div>
    </div>
  );
}
