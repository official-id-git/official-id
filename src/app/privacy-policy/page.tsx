import { Metadata } from 'next'
import LegalPageHeader from '@/components/layout/LegalPageHeader'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Kebijakan Privasi | Official ID',
    description: 'Kebijakan privasi dan perlindungan data pengguna Official ID (https://official.id) sesuai UU PDP Indonesia, GDPR, dan standar platform global.',
}

export default function PrivacyPolicyPage() {
    const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <div className="min-h-screen bg-gray-50">
            <LegalPageHeader />

            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kebijakan Privasi</h1>
                    <p className="text-gray-500 mb-8">Terakhir diperbarui: {lastUpdated}</p>

                    <div className="prose prose-blue max-w-none space-y-8 text-gray-600">
                        {/* Introduction */}
                        <section>
                            <p className="text-lg">
                                Selamat datang di <strong>Official ID</strong>. Kebijakan Privasi ini menjelaskan bagaimana PT GLOBAL INOVASI STRATEGIS ("kami", "Official ID") yang mengoperasikan situs web <a href="https://official.id" className="text-[#2D7C88] hover:underline font-medium">https://official.id</a> mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda.
                            </p>
                            <p>
                                Kami berkomitmen untuk melindungi privasi Anda sesuai dengan <strong>Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP)</strong>, <strong>General Data Protection Regulation (GDPR)</strong> Uni Eropa, serta kebijakan platform <strong>Google</strong>, <strong>Meta (Facebook/Instagram)</strong>, dan <strong>LinkedIn</strong>.
                            </p>
                        </section>

                        {/* 1. Data Controller */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Pengendali Data (Data Controller)</h2>
                            <p>
                                Pengendali data untuk layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> adalah:
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg mt-3">
                                <p className="font-medium text-gray-900">PT GLOBAL INOVASI STRATEGIS</p>
                                <p>Email: privacy@official.id</p>
                                <p>Website: <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></p>
                            </div>
                        </section>

                        {/* 2. Data Collection */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Data yang Kami Kumpulkan</h2>
                            <p>Saat Anda menggunakan layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, kami dapat mengumpulkan data berikut:</p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Data yang Anda Berikan Langsung</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Informasi Identitas:</strong> Nama lengkap, gelar profesional, foto profil</li>
                                <li><strong>Informasi Kontak:</strong> Alamat email, nomor telepon, alamat fisik</li>
                                <li><strong>Informasi Profesional:</strong> Nama perusahaan/organisasi, jabatan, riwayat pekerjaan</li>
                                <li><strong>Akun Media Sosial:</strong> Link profil LinkedIn, Facebook, Instagram, Twitter/X, dan platform lainnya</li>
                                <li><strong>Informasi Akun:</strong> Kredensial login (email dan password terenkripsi)</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Data yang Dikumpulkan Secara Otomatis</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Data Perangkat:</strong> Jenis perangkat, sistem operasi, browser</li>
                                <li><strong>Data Log:</strong> Alamat IP, waktu akses, halaman yang dikunjungi</li>
                                <li><strong>Cookie dan Teknologi Pelacakan:</strong> Untuk meningkatkan pengalaman pengguna</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.3 Data dari Pihak Ketiga</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>Login Sosial:</strong> Data dari Google atau LinkedIn jika Anda menggunakan opsi login tersebut</li>
                                <li><strong>Penyedia Pembayaran:</strong> Informasi transaksi dari payment gateway</li>
                            </ul>
                        </section>

                        {/* 3. Legal Basis */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Dasar Hukum Pemrosesan Data</h2>
                            <p>Sesuai dengan UU PDP dan GDPR, kami memproses data pribadi Anda berdasarkan:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li><strong>Persetujuan (Consent):</strong> Saat Anda mendaftar dan menyetujui Kebijakan Privasi ini</li>
                                <li><strong>Pelaksanaan Kontrak:</strong> Untuk menyediakan layanan kartu bisnis digital di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                                <li><strong>Kewajiban Hukum:</strong> Untuk mematuhi peraturan perundang-undangan yang berlaku</li>
                                <li><strong>Kepentingan Sah:</strong> Untuk meningkatkan keamanan dan kualitas layanan</li>
                            </ul>
                        </section>

                        {/* 4. Data Usage */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Penggunaan Data</h2>
                            <p>Data yang dikumpulkan di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> digunakan untuk:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Menyediakan dan mengelola akun kartu bisnis digital Anda</li>
                                <li>Memfasilitasi fitur manajemen organisasi dan jejaring profesional</li>
                                <li>Memproses transaksi dan pembayaran layanan premium</li>
                                <li>Mengirimkan notifikasi penting terkait akun dan layanan</li>
                                <li>Meningkatkan keamanan, performa, dan pengalaman pengguna</li>
                                <li>Menganalisis penggunaan layanan untuk pengembangan fitur</li>
                                <li>Mematuhi kewajiban hukum dan peraturan yang berlaku</li>
                            </ul>
                        </section>

                        {/* 5. Data Sharing */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Pembagian Data kepada Pihak Ketiga</h2>
                            <p>Kami TIDAK menjual data pribadi Anda. Kami hanya membagikan data dalam situasi berikut:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li>
                                    <strong>Penyedia Layanan:</strong> Pihak ketiga yang membantu operasional <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> (hosting, payment gateway, email service) dengan perjanjian kerahasiaan
                                </li>
                                <li>
                                    <strong>Publik (Sesuai Pilihan Anda):</strong> Informasi pada kartu bisnis digital yang Anda pilih untuk ditampilkan secara publik
                                </li>
                                <li>
                                    <strong>Kewajiban Hukum:</strong> Jika diwajibkan oleh hukum, perintah pengadilan, atau otoritas pemerintah yang berwenang
                                </li>
                                <li>
                                    <strong>Perlindungan Hak:</strong> Untuk melindungi hak, properti, atau keselamatan Official ID dan pengguna lain
                                </li>
                            </ul>
                        </section>

                        {/* 6. Data Security */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Keamanan Data</h2>
                            <p>
                                <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai, termasuk:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Enkripsi data saat transit (HTTPS/TLS) dan saat disimpan</li>
                                <li>Password hashing dengan algoritma yang aman</li>
                                <li>Kontrol akses berbasis peran (role-based access control)</li>
                                <li>Audit log dan monitoring keamanan</li>
                                <li>Penilaian keamanan berkala</li>
                            </ul>
                        </section>

                        {/* 7. Cookies */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Cookie dan Teknologi Pelacakan</h2>
                            <p>
                                <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> menggunakan cookie untuk:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li><strong>Cookie Esensial:</strong> Diperlukan untuk fungsi dasar situs (autentikasi, keamanan)</li>
                                <li><strong>Cookie Analitik:</strong> Untuk memahami bagaimana pengguna berinteraksi dengan situs</li>
                                <li><strong>Cookie Preferensi:</strong> Untuk menyimpan pengaturan dan preferensi Anda</li>
                            </ul>
                            <p className="mt-3">
                                Anda dapat mengatur preferensi cookie melalui pengaturan browser Anda. Menonaktifkan cookie tertentu dapat mempengaruhi fungsionalitas situs.
                            </p>
                        </section>

                        {/* 8. User Rights */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Hak-Hak Anda (Sesuai UU PDP & GDPR)</h2>
                            <p>Sebagai pengguna <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, Anda memiliki hak untuk:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li><strong>Hak Akses:</strong> Mendapatkan informasi tentang data pribadi Anda yang kami simpan</li>
                                <li><strong>Hak Perbaikan:</strong> Meminta koreksi data pribadi yang tidak akurat atau tidak lengkap</li>
                                <li><strong>Hak Penghapusan (Right to be Forgotten):</strong> Meminta penghapusan data pribadi Anda (lihat <Link href="/delete-account" className="text-[#2D7C88] hover:underline">Kebijakan Penghapusan Akun</Link>)</li>
                                <li><strong>Hak Pembatasan:</strong> Membatasi pemrosesan data pribadi dalam kondisi tertentu</li>
                                <li><strong>Hak Portabilitas:</strong> Menerima data pribadi Anda dalam format yang dapat dibaca mesin</li>
                                <li><strong>Hak Keberatan:</strong> Menolak pemrosesan data untuk tujuan tertentu</li>
                                <li><strong>Hak Menarik Persetujuan:</strong> Menarik persetujuan yang telah diberikan</li>
                            </ul>
                            <p className="mt-3">
                                Untuk menggunakan hak-hak tersebut, silakan hubungi kami di <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a>.
                            </p>
                        </section>

                        {/* 9. Data Retention */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Penyimpanan Data</h2>
                            <p>
                                Kami menyimpan data pribadi Anda di server yang berlokasi di Indonesia dan/atau negara lain yang menjamin tingkat perlindungan data yang setara. Data akan disimpan selama:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Akun Anda aktif di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                                <li>Diperlukan untuk memenuhi tujuan yang dijelaskan dalam kebijakan ini</li>
                                <li>Diwajibkan oleh hukum untuk penyimpanan catatan tertentu</li>
                            </ul>
                            <p className="mt-3">
                                Setelah akun dihapus, data akan dihapus atau dianonimkan dalam waktu 30 hari, kecuali ada kewajiban hukum untuk menyimpannya lebih lama.
                            </p>
                        </section>

                        {/* 10. International Transfer */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Transfer Data Internasional</h2>
                            <p>
                                Dalam menjalankan layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, data Anda mungkin ditransfer ke negara di luar Indonesia. Kami memastikan:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Transfer dilakukan ke negara dengan tingkat perlindungan data yang memadai</li>
                                <li>Perjanjian pemrosesan data yang sesuai diterapkan</li>
                                <li>Langkah-langkah keamanan yang tepat diimplementasikan</li>
                            </ul>
                        </section>

                        {/* 11. Third-Party Services */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Layanan Pihak Ketiga</h2>
                            <p>
                                <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> terintegrasi dengan layanan pihak ketiga berikut:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li><strong>Google:</strong> Untuk autentikasi login dan analitik (tunduk pada <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Kebijakan Privasi Google</a>)</li>
                                <li><strong>LinkedIn:</strong> Untuk autentikasi login dan data profil profesional (tunduk pada <a href="https://www.linkedin.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Kebijakan Privasi LinkedIn</a>)</li>
                                <li><strong>Supabase:</strong> Untuk database dan autentikasi</li>
                                <li><strong>Cloudinary:</strong> Untuk penyimpanan dan pengolahan gambar</li>
                            </ul>
                        </section>

                        {/* 12. Children's Privacy */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Privasi Anak-Anak</h2>
                            <p>
                                Layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> ditujukan untuk pengguna berusia 18 tahun ke atas atau sesuai usia minimum yang diperbolehkan di yurisdiksi Anda untuk memberikan persetujuan penggunaan data pribadi. Kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak di bawah usia tersebut.
                            </p>
                        </section>

                        {/* 13. Policy Changes */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Perubahan Kebijakan Privasi</h2>
                            <p>
                                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau pemberitahuan di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>. Penggunaan berkelanjutan atas layanan kami setelah perubahan dianggap sebagai persetujuan terhadap kebijakan yang diperbarui.
                            </p>
                        </section>

                        {/* 14. Complaints */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Pengaduan</h2>
                            <p>
                                Jika Anda memiliki keluhan terkait penanganan data pribadi Anda, Anda berhak untuk:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Menghubungi kami terlebih dahulu di <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a></li>
                                <li>Mengajukan pengaduan ke Lembaga Perlindungan Data Pribadi yang berwenang di Indonesia</li>
                                <li>Bagi subjek data di Uni Eropa: mengajukan pengaduan ke Data Protection Authority setempat</li>
                            </ul>
                        </section>

                        {/* 15. Contact */}
                        <section className="bg-[#2D7C88]/5 p-6 rounded-xl border border-[#2D7C88]/20">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Hubungi Kami</h2>
                            <p>
                                Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini atau ingin menggunakan hak privasi Anda, silakan hubungi kami:
                            </p>
                            <div className="mt-4 space-y-2">
                                <p><strong>Official ID</strong></p>
                                <p>Website: <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></p>
                                <p>Email Privasi: <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a></p>
                                <p>Email Dukungan: <a href="mailto:support@official.id" className="text-[#2D7C88] hover:underline">support@official.id</a></p>
                            </div>
                        </section>

                        {/* Related Links */}
                        <section className="border-t pt-6">
                            <p className="text-sm text-gray-500">
                                Lihat juga: <Link href="/terms" className="text-[#2D7C88] hover:underline">Syarat dan Ketentuan</Link> | <Link href="/delete-account" className="text-[#2D7C88] hover:underline">Kebijakan Penghapusan Akun</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
