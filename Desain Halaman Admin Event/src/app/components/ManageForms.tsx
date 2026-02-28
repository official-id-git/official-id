import { useState } from "react";
import { Plus, GripVertical, Trash2, Save } from "lucide-react";
import { defaultFormFields, FormField } from "../data/mockData";

export default function ManageForms() {
  const [fields, setFields] = useState<FormField[]>(defaultFormFields);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState<FormField>({
    id: "",
    label: "",
    type: "text",
    required: false,
  });

  const handleAddField = () => {
    if (newField.label) {
      setFields([
        ...fields,
        { ...newField, id: Date.now().toString() },
      ]);
      setNewField({ id: "", label: "", type: "text", required: false });
      setShowAddField(false);
    }
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleToggleRequired = (id: string) => {
    setFields(
      fields.map((f) =>
        f.id === id ? { ...f, required: !f.required } : f
      )
    );
  };

  const handleSave = () => {
    console.log("Saved fields:", fields);
    alert("Form berhasil disimpan!");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Kelola Form Pendaftaran
        </h1>
        <p className="text-gray-600 mt-2">
          Atur pertanyaan dan field untuk formulir pendaftaran event
        </p>
      </div>

      <div className="max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Field Formulir
            </h2>
            <button
              onClick={() => setShowAddField(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Tambah Field
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <div
                key={field.id}
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {field.label}
                    </span>
                    {field.required && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                        Wajib
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Tipe:{" "}
                    {field.type === "text"
                      ? "Teks"
                      : field.type === "email"
                      ? "Email"
                      : field.type === "phone"
                      ? "Telepon"
                      : field.type === "select"
                      ? "Pilihan"
                      : "Area Teks"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRequired(field.id)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {field.required ? "Opsional" : "Wajibkan"}
                  </button>
                  <button
                    onClick={() => handleRemoveField(field.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showAddField && (
            <div className="mt-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-gray-900 mb-4">
                Tambah Field Baru
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Label Field
                  </label>
                  <input
                    type="text"
                    value={newField.label}
                    onChange={(e) =>
                      setNewField({ ...newField, label: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: Nama Perusahaan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Tipe Field
                  </label>
                  <select
                    value={newField.type}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        type: e.target.value as FormField["type"],
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="text">Teks</option>
                    <option value="email">Email</option>
                    <option value="phone">Telepon</option>
                    <option value="select">Pilihan</option>
                    <option value="textarea">Area Teks</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="required"
                    checked={newField.required}
                    onChange={(e) =>
                      setNewField({
                        ...newField,
                        required: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="required" className="text-sm text-gray-900">
                    Field wajib diisi
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddField}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tambah
                  </button>
                  <button
                    onClick={() => setShowAddField(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Preview Formulir
          </h2>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  {field.label}
                  {field.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    disabled
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                ) : field.type === "select" ? (
                  <select
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  >
                    <option>Pilih...</option>
                  </select>
                ) : (
                  <input
                    type={field.type}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save className="w-5 h-5" />
            Simpan Formulir
          </button>
        </div>
      </div>
    </div>
  );
}
