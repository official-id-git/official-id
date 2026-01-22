import { Metadata } from 'next'
import LegalPageHeader from '@/components/layout/LegalPageHeader'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Syarat dan Ketentuan | Official ID',
    description: 'Syarat dan ketentuan penggunaan layanan Official ID (https://official.id) sesuai standar hukum Indonesia dan internasional.',
}

export default function TermsPage() {
    const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <div className="min-h-screen bg-gray-50">
            <LegalPageHeader />

            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Syarat dan Ketentuan</h1>
                    <p className="text-gray-500 mb-8">Terakhir diperbarui: {lastUpdated}</p>

                    <div className="prose prose-blue max-w-none space-y-8 text-gray-600">
                        {/* Introduction */}
                        <section>
                            <p className="text-lg">
                                Selamat datang di <strong>Official ID</strong>. Syarat dan Ketentuan ini mengatur penggunaan Anda atas situs web <a href="https://official.id" className="text-[#2D7C88] hover:underline font-medium">https://official.id</a> dan semua layanan yang disediakan oleh PT GLOBAL INOVASI STRATEGIS ("kami", "Official ID").
                            </p>
                            <p>
                                Dengan mengakses atau menggunakan layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, Anda menyetujui untuk terikat oleh Syarat dan Ketentuan ini, <Link href="/privacy-policy" className="text-[#2D7C88] hover:underline">Kebijakan Privasi</Link> kami, dan semua pedoman yang berlaku. Jika Anda tidak menyetujui ketentuan ini, mohon untuk tidak menggunakan layanan kami.
                            </p>
                        </section>

                        {/* 1. Definitions */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Definisi</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>"Layanan"</strong> merujuk pada platform kartu bisnis digital, manajemen organisasi, dan jejaring profesional yang disediakan melalui <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                                <li><strong>"Pengguna"</strong> atau <strong>"Anda"</strong> merujuk pada individu atau entitas yang menggunakan Layanan</li>
                                <li><strong>"Konten Pengguna"</strong> merujuk pada informasi, data, teks, foto, dan materi lain yang Anda unggah ke Layanan</li>
                                <li><strong>"Akun"</strong> merujuk pada akun yang Anda buat untuk mengakses Layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                            </ul>
                        </section>

                        {/* 2. Services */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Deskripsi Layanan</h2>
                            <p>
                                <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> menyediakan:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Platform pembuatan dan pengelolaan kartu bisnis digital profesional</li>
                                <li>Fitur manajemen organisasi dan tim</li>
                                <li>Jejaring profesional dan pertukaran kontak digital</li>
                                <li>Integrasi dengan platform sosial profesional (LinkedIn, dll.)</li>
                                <li>Layanan premium dengan fitur tambahan</li>
                            </ul>
                            <p className="mt-3">
                                Kami berhak untuk mengubah, menangguhkan, atau menghentikan aspek apa pun dari Layanan kapan saja dengan atau tanpa pemberitahuan sebelumnya.
                            </p>
                        </section>

                        {/* 3. Account Requirements */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Persyaratan Akun</h2>
                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.1 Kelayakan</h3>
                            <p>Untuk menggunakan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, Anda harus:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Berusia minimal 18 tahun atau usia dewasa menurut hukum di yurisdiksi Anda</li>
                                <li>Memiliki kapasitas hukum untuk membuat perjanjian yang mengikat</li>
                                <li>Tidak dilarang menggunakan Layanan berdasarkan hukum yang berlaku</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">3.2 Tanggung Jawab Akun</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Anda bertanggung jawab menjaga kerahasiaan kredensial login Anda</li>
                                <li>Anda harus memberikan informasi yang akurat dan terkini</li>
                                <li>Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda</li>
                                <li>Anda wajib segera memberitahu kami jika ada penggunaan tidak sah atas akun Anda</li>
                            </ul>
                        </section>

                        {/* 4. Acceptable Use */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Penggunaan yang Dapat Diterima</h2>
                            <p>Saat menggunakan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, Anda setuju untuk TIDAK:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Melanggar hukum atau peraturan yang berlaku</li>
                                <li>Melanggar hak kekayaan intelektual atau hak pihak lain</li>
                                <li>Mengunggah konten yang menyinggung, cabul, atau melecehkan</li>
                                <li>Menyebarkan malware, virus, atau kode berbahaya lainnya</li>
                                <li>Melakukan spam, phishing, atau penipuan</li>
                                <li>Mengganggu atau merusak infrastruktur Layanan</li>
                                <li>Mengumpulkan data pengguna lain tanpa izin</li>
                                <li>Membuat akun palsu atau menyamar sebagai orang lain</li>
                                <li>Menggunakan bot atau sistem otomatis tanpa persetujuan tertulis</li>
                            </ul>
                        </section>

                        {/* 5. User Content */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Konten Pengguna</h2>
                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.1 Kepemilikan</h3>
                            <p>
                                Anda mempertahankan kepemilikan atas semua Konten Pengguna yang Anda unggah ke <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> (termasuk foto, data profil, dan materi lainnya).
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.2 Lisensi kepada Official ID</h3>
                            <p>
                                Dengan mengunggah Konten Pengguna, Anda memberikan kepada Official ID lisensi non-eksklusif, bebas royalti, dapat disublisensikan, dan berlaku di seluruh dunia untuk menggunakan, menyimpan, menampilkan, dan mendistribusikan Konten Pengguna Anda sebatas yang diperlukan untuk menyediakan Layanan.
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">5.3 Tanggung Jawab Konten</h3>
                            <p>
                                Anda bertanggung jawab penuh atas Konten Pengguna yang Anda unggah dan menjamin bahwa Anda memiliki hak untuk membagikannya.
                            </p>
                        </section>

                        {/* 6. Payment Terms */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Pembayaran dan Langganan</h2>
                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.1 Layanan Berbayar</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Fitur premium di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> dikenakan biaya sesuai harga yang tertera</li>
                                <li>Semua harga dalam Rupiah Indonesia (IDR) kecuali dinyatakan lain</li>
                                <li>Harga dapat berubah dengan pemberitahuan 30 hari sebelumnya</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.2 Metode Pembayaran</h3>
                            <p>
                                Pembayaran diproses melalui penyedia layanan pembayaran pihak ketiga yang aman. Anda setuju untuk mematuhi syarat dan ketentuan penyedia pembayaran tersebut.
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">6.3 Pajak</h3>
                            <p>
                                Harga mungkin belum termasuk pajak yang berlaku. Anda bertanggung jawab atas semua pajak yang dikenakan sesuai hukum yang berlaku.
                            </p>
                        </section>

                        {/* 7. No Refund Policy - HIGHLIGHTED */}
                        <section className="bg-red-50 p-6 rounded-xl border border-red-200">
                            <h2 className="text-xl font-semibold text-red-800 mb-4">7. Kebijakan Pengembalian Dana dan Penghentian Layanan</h2>

                            <div className="space-y-4 text-red-900/80">
                                <div>
                                    <p className="font-semibold">7.1 Tidak Ada Pengembalian Dana (No Refund)</p>
                                    <p className="mt-1">Semua pembayaran yang telah dilakukan untuk layanan <a href="https://official.id" className="text-red-700 hover:underline">https://official.id</a> bersifat <strong>final dan tidak dapat dikembalikan (non-refundable)</strong>, kecuali diwajibkan oleh hukum yang berlaku atau kebijakan platform (Google Play, App Store) yang berlaku.</p>
                                </div>

                                <div>
                                    <p className="font-semibold">7.2 Penghentian Operasional (Sunset)</p>
                                    <p className="mt-1">Dalam hal Official ID memutuskan untuk menghentikan operasional layanan <a href="https://official.id" className="text-red-700 hover:underline">https://official.id</a> secara permanen:</p>
                                    <ul className="list-disc pl-5 space-y-1 mt-2">
                                        <li>Kami akan memberikan pemberitahuan minimal 30 hari sebelumnya</li>
                                        <li>Pengguna tidak berhak menuntut pengembalian dana untuk sisa masa langganan</li>
                                        <li>Pengguna akan diberikan kesempatan untuk mengunduh data mereka sebelum penutupan</li>
                                    </ul>
                                </div>

                                <div>
                                    <p className="font-semibold">7.3 Pelepasan Tuntutan</p>
                                    <p className="mt-1">Anda setuju untuk melepaskan Official ID dari segala tuntutan ganti rugi terkait penghentian layanan akibat penutupan operasional bisnis.</p>
                                </div>
                            </div>
                        </section>

                        {/* 8. Intellectual Property */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Hak Kekayaan Intelektual</h2>
                            <p>
                                Semua hak kekayaan intelektual atas Layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, termasuk tetapi tidak terbatas pada merek dagang, logo, desain, kode sumber, dan konten asli, adalah milik Official ID atau pemberi lisensinya.
                            </p>
                            <p className="mt-3">
                                Anda tidak diperkenankan untuk menyalin, memodifikasi, mendistribusikan, menjual, atau menyewakan bagian mana pun dari Layanan atau perangkat lunak terkait tanpa persetujuan tertulis dari kami.
                            </p>
                        </section>

                        {/* 9. Termination */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Pemutusan Layanan</h2>
                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.1 Oleh Pengguna</h3>
                            <p>
                                Anda dapat menghentikan akun Anda kapan saja melalui pengaturan akun atau dengan menghubungi kami. Lihat <Link href="/delete-account" className="text-[#2D7C88] hover:underline">Kebijakan Penghapusan Akun</Link> untuk informasi lebih lanjut.
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">9.2 Oleh Official ID</h3>
                            <p>
                                Kami berhak untuk menangguhkan atau menghentikan akun Anda tanpa pemberitahuan sebelumnya jika:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Anda melanggar Syarat dan Ketentuan ini</li>
                                <li>Anda melanggar hukum yang berlaku</li>
                                <li>Terdapat aktivitas mencurigakan atau penipuan</li>
                                <li>Diperlukan untuk melindungi pengguna lain atau integritas Layanan</li>
                            </ul>
                        </section>

                        {/* 10. Disclaimer */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Penafian (Disclaimer)</h2>
                            <p>
                                Layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> disediakan "sebagaimana adanya" dan "sebagaimana tersedia" tanpa jaminan dalam bentuk apa pun, baik tersurat maupun tersirat, termasuk tetapi tidak terbatas pada jaminan dapat diperjualbelikan, kesesuaian untuk tujuan tertentu, dan tidak ada pelanggaran.
                            </p>
                            <p className="mt-3">
                                Kami tidak menjamin bahwa Layanan akan bebas dari kesalahan, aman, atau tersedia tanpa gangguan.
                            </p>
                        </section>

                        {/* 11. Limitation of Liability */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Batasan Tanggung Jawab</h2>
                            <p>
                                Sejauh diizinkan oleh hukum yang berlaku, Official ID dan afiliasinya tidak bertanggung jawab atas:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Kerugian tidak langsung, insidental, khusus, atau konsekuensial</li>
                                <li>Kehilangan keuntungan, data, atau goodwill</li>
                                <li>Gangguan bisnis</li>
                                <li>Kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan Layanan</li>
                            </ul>
                            <p className="mt-3">
                                Total tanggung jawab kami kepada Anda untuk semua klaim tidak akan melebihi jumlah yang Anda bayarkan kepada kami dalam 12 bulan terakhir.
                            </p>
                        </section>

                        {/* 12. Indemnification */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Ganti Rugi (Indemnification)</h2>
                            <p>
                                Anda setuju untuk membebaskan, membela, dan mengganti rugi Official ID, direktur, karyawan, dan agennya dari dan terhadap semua klaim, kerugian, biaya, dan pengeluaran (termasuk biaya hukum yang wajar) yang timbul dari:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Penggunaan Anda atas Layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                                <li>Pelanggaran Anda terhadap Syarat dan Ketentuan ini</li>
                                <li>Pelanggaran Anda terhadap hak pihak ketiga mana pun</li>
                                <li>Konten Pengguna yang Anda unggah</li>
                            </ul>
                        </section>

                        {/* 13. Governing Law */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Hukum yang Berlaku</h2>
                            <p>
                                Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan prinsip-prinsip konflik hukumnya.
                            </p>
                        </section>

                        {/* 14. Dispute Resolution */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Penyelesaian Sengketa</h2>
                            <p>
                                Setiap sengketa yang timbul dari atau terkait dengan Syarat dan Ketentuan ini atau penggunaan layanan <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> akan diselesaikan melalui:
                            </p>
                            <ol className="list-decimal pl-5 space-y-2 mt-3">
                                <li><strong>Negosiasi:</strong> Upaya penyelesaian secara damai melalui diskusi langsung</li>
                                <li><strong>Mediasi:</strong> Jika negosiasi gagal, melalui mediasi oleh mediator yang disepakati bersama</li>
                                <li><strong>Arbitrase/Pengadilan:</strong> Jika mediasi gagal, melalui arbitrase atau pengadilan yang berwenang di Indonesia</li>
                            </ol>
                        </section>

                        {/* 15. Platform Compliance */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Kepatuhan Platform</h2>
                            <p>
                                <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> berkomitmen untuk mematuhi persyaratan platform berikut:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li>
                                    <strong>Google:</strong> <a href="https://play.google.com/about/developer-content-policy/" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Google Play Developer Policy</a> dan <a href="https://developers.google.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Google API Terms of Service</a>
                                </li>
                                <li>
                                    <strong>Meta:</strong> <a href="https://developers.facebook.com/terms" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Meta Platform Terms</a> dan <a href="https://developers.facebook.com/policy" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Developer Policies</a>
                                </li>
                                <li>
                                    <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/legal/l/api-terms-of-use" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">LinkedIn API Terms of Use</a>
                                </li>
                            </ul>
                        </section>

                        {/* 16. Changes to Terms */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Perubahan Syarat dan Ketentuan</h2>
                            <p>
                                Kami dapat memperbarui Syarat dan Ketentuan ini dari waktu ke waktu. Perubahan material akan diberitahukan melalui email atau pemberitahuan di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> minimal 30 hari sebelum berlaku efektif.
                            </p>
                            <p className="mt-3">
                                Penggunaan berkelanjutan atas Layanan setelah perubahan berlaku efektif dianggap sebagai persetujuan Anda terhadap syarat yang diperbarui.
                            </p>
                        </section>

                        {/* 17. Severability */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Keterpisahan</h2>
                            <p>
                                Jika ada ketentuan dalam Syarat dan Ketentuan ini yang dianggap tidak sah atau tidak dapat dilaksanakan oleh pengadilan yang berwenang, ketentuan tersebut akan dibatasi atau dihilangkan seminimal mungkin, dan ketentuan lainnya akan tetap berlaku penuh.
                            </p>
                        </section>

                        {/* 18. Contact */}
                        <section className="bg-[#2D7C88]/5 p-6 rounded-xl border border-[#2D7C88]/20">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">18. Hubungi Kami</h2>
                            <p>
                                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami:
                            </p>
                            <div className="mt-4 space-y-2">
                                <p><strong>Official ID</strong></p>
                                <p>Website: <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></p>
                                <p>Email Hukum: <a href="mailto:legal@official.id" className="text-[#2D7C88] hover:underline">legal@official.id</a></p>
                                <p>Email Dukungan: <a href="mailto:support@official.id" className="text-[#2D7C88] hover:underline">support@official.id</a></p>
                            </div>
                        </section>

                        {/* Related Links */}
                        <section className="border-t pt-6">
                            <p className="text-sm text-gray-500">
                                Lihat juga: <Link href="/privacy-policy" className="text-[#2D7C88] hover:underline">Kebijakan Privasi</Link> | <Link href="/delete-account" className="text-[#2D7C88] hover:underline">Kebijakan Penghapusan Akun</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
