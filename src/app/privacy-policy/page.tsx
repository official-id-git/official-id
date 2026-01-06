import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Kebijakan Privasi | Official ID',
    description: 'Kebijakan privasi dan perlindungan data pengguna Official ID sesuai UU PDP dan GDPR.',
}

export default function PrivacyPolicyPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Kebijakan Privasi</h1>

                <div className="prose prose-blue max-w-none space-y-6 text-gray-600">
                    <p>
                        Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <p>
                        Official ID ("kami") berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, memproses, dan melindungi data pribadi Anda sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP) Indonesia dan General Data Protection Regulation (GDPR).
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Pengumpulan Data</h2>
                        <p>Kami mengumpulkan data yang Anda berikan secara langsung saat menggunakan layanan kami, termasuk:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Informasi identitas (Nama, gelar profesional).</li>
                            <li>Informasi kontak (Email, nomor telepon, alamat).</li>
                            <li>Informasi profil (Foto, akun media sosial, riwayat pekerjaan).</li>
                            <li>Data pembayaran (Diproses oleh penyedia layanan pembayaran pihak ketiga).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Penggunaan Data</h2>
                        <p>Kami menggunakan data Anda untuk:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Menyediakan layanan kartu bisnis digital dan manajemen organisasi.</li>
                            <li>Memproses transaksi pembayaran Anda.</li>
                            <li>Mengirimkan notifikasi terkait akun dan layanan.</li>
                            <li>Meningkatkan keamanan dan performa aplikasi.</li>
                            <li>Mematuhi kewajiban hukum yang berlaku.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Hak Anda (Sesuai UU PDP & GDPR)</h2>
                        <p>Anda memiliki hak untuk:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Mengakses data pribadi Anda yang kami simpan.</li>
                            <li>Memperbaiki data yang tidak akurat.</li>
                            <li>Meminta penghapusan data ("Hak untuk Dilupakan"), kecuali jika kami diwajibkan oleh hukum untuk menyimpannya.</li>
                            <li>Membatasi atau menolak pemrosesan data tertentu.</li>
                            <li>Mengunduh data Anda dalam format yang dapat dibaca mesin (Portabilitas Data).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Keamanan Data</h2>
                        <p>
                            Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data pribadi Anda dari akses tidak sah, pengungkapan, perubahan, atau pemusnahan. Semua data sensitif dienkripsi saat transit dan saat disimpan.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Penyimpanan Data</h2>
                        <p>
                            Kami menyimpan data pribadi Anda hanya selama diperlukan untuk tujuan yang dijelaskan dalam kebijakan ini atau selama diwajibkan oleh hukum. Jika akun Anda dihapus, kami akan menghapus atau menganonimkan data Anda sesuai prosedur penghapusan kami.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Hubungi Kami</h2>
                        <p>
                            Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin menggunakan hak privasi Anda, silakan hubungi kami melalui email di support@official.id.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
