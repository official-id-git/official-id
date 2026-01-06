import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Syarat & Ketentuan | Official ID',
    description: 'Syarat dan ketentuan penggunaan layanan Official ID.',
}

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Syarat dan Ketentuan</h1>

                <div className="prose prose-blue max-w-none space-y-6 text-gray-600">
                    <p>
                        Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <p>
                        Dengan menggunakan layanan Official ID, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini. Mohon baca dengan saksama sebelum menggunakan layanan kami.
                    </p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Layanan Kami</h2>
                        <p>
                            Official ID menyediakan platform untuk pembuatan kartu bisnis digital, manajemen organisasi, dan jejaring profesional. Kami berhak untuk mengubah, menangguhkan, atau menghentikan aspek apa pun dari layanan kapan saja.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Akun Pengguna</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda.</li>
                            <li>Anda setuju untuk memberikan informasi yang akurat dan terkini.</li>
                            <li>Kami berhak menonaktifkan akun yang melanggar ketentuan ini atau hukum yang berlaku.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Pembayaran dan Layanan Berlangganan</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Layanan premium dikenakan biaya sesuai dengan harga yang tertera saat pembelian.</li>
                            <li>Pembayaran mencakup akses ke fitur layanan selama periode berlangganan aktif atau selama aplikasi masih beroperasional.</li>
                            <li>Kami berhak mengubah harga layanan dengan pemberitahuan sebelumnya.</li>
                        </ul>
                    </section>

                    <section className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h2 className="text-xl font-semibold text-red-800 mb-4">4. Kebijakan Penghentian Layanan & Pengembalian Dana</h2>
                        <div className="space-y-3 text-red-900/80">
                            <p>
                                <strong>4.1 Tidak Ada Pengembalian Dana (No Refund):</strong> Semua pembayaran yang telah dilakukan bersifat final dan tidak dapat dikembalikan (non-refundable), kecuali diwajibkan oleh hukum yang berlaku.
                            </p>
                            <p>
                                <strong>4.2 Penghentian Operasional:</strong> Dalam hal Official ID menghentikan operasional layanan secara permanen ("Sunset"), pelanggan tidak berhak menuntut pengembalian uang (refund) atau kompensasi untuk sisa masa berlangganan yang belum terpakai.
                            </p>
                            <p>
                                <strong>4.3 Ganti Rugi:</strong> Anda setuju untuk melepaskan Official ID dari segala tuntutan ganti rugi terkait penghentian layanan akibat penutupan operasional bisnis.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Konten Pengguna</h2>
                        <p>
                            Anda memegang hak cipta atas konten yang Anda unggah (foto, data profil). Namun, Anda memberikan kami lisensi non-eksklusif untuk menampilkan konten tersebut sebagai bagian dari layanan kami (kartu digital).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Batasan Tanggung Jawab</h2>
                        <p>
                            Official ID tidak bertanggung jawab atas kerugian tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan kami.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Hukum yang Berlaku</h2>
                        <p>
                            Syarat dan Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan di yurisdiksi pengadilan Indonesia.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
