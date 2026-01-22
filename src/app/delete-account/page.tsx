import { Metadata } from 'next'
import LegalPageHeader from '@/components/layout/LegalPageHeader'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Kebijakan Penghapusan Akun | Official ID',
    description: 'Informasi dan prosedur penghapusan akun di Official ID (https://official.id) sesuai standar GDPR, UU PDP, Google, Meta, dan LinkedIn.',
}

export default function DeleteAccountPage() {
    const lastUpdated = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

    return (
        <div className="min-h-screen bg-gray-50">
            <LegalPageHeader />

            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Kebijakan Penghapusan Akun</h1>
                    <p className="text-gray-500 mb-8">Terakhir diperbarui: {lastUpdated}</p>

                    <div className="prose prose-blue max-w-none space-y-8 text-gray-600">
                        {/* Introduction */}
                        <section>
                            <p className="text-lg">
                                Halaman ini menjelaskan kebijakan dan prosedur penghapusan akun di <a href="https://official.id" className="text-[#2D7C88] hover:underline font-medium">https://official.id</a>. Kami menghormati hak Anda untuk menghapus akun dan data pribadi Anda sesuai dengan <strong>Undang-Undang Perlindungan Data Pribadi (UU PDP) Indonesia</strong>, <strong>General Data Protection Regulation (GDPR)</strong> Uni Eropa, serta persyaratan <strong>Google</strong>, <strong>Meta</strong>, dan <strong>LinkedIn</strong>.
                            </p>
                        </section>

                        {/* 1. Your Right to Delete */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Hak Anda untuk Menghapus Akun</h2>
                            <p>
                                Sesuai dengan UU PDP Pasal 8 dan GDPR Pasal 17 (Hak untuk Dilupakan / Right to be Forgotten), Anda memiliki hak untuk meminta penghapusan akun dan data pribadi Anda dari <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> kapan saja.
                            </p>
                            <p className="mt-3">
                                Hak ini berlaku ketika:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Data pribadi tidak lagi diperlukan untuk tujuan awal pengumpulan</li>
                                <li>Anda menarik persetujuan yang menjadi dasar pemrosesan</li>
                                <li>Anda menolak pemrosesan dan tidak ada alasan sah yang mengesampingkan</li>
                                <li>Data pribadi telah diproses secara tidak sah</li>
                                <li>Data pribadi harus dihapus untuk memenuhi kewajiban hukum</li>
                            </ul>
                        </section>

                        {/* 2. How to Request Deletion */}
                        <section className="bg-[#2D7C88]/5 p-6 rounded-xl border border-[#2D7C88]/20">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Cara Mengajukan Penghapusan Akun</h2>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Metode 1: Melalui Aplikasi (Self-Service)</h3>
                            <ol className="list-decimal pl-5 space-y-2">
                                <li>Login ke akun Anda di <a href="https://official.id/login" className="text-[#2D7C88] hover:underline">https://official.id/login</a></li>
                                <li>Buka menu <strong>Pengaturan (Settings)</strong></li>
                                <li>Pilih <strong>Akun</strong> atau <strong>Privasi</strong></li>
                                <li>Klik <strong>Hapus Akun</strong></li>
                                <li>Konfirmasi dengan memasukkan password Anda</li>
                                <li>Ikuti instruksi untuk menyelesaikan proses penghapusan</li>
                            </ol>

                            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">Metode 2: Melalui Email</h3>
                            <p>
                                Kirim permintaan penghapusan akun ke:
                            </p>
                            <div className="bg-white p-4 rounded-lg mt-3 border">
                                <p><strong>Email:</strong> <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a></p>
                                <p className="mt-2"><strong>Subjek:</strong> Permintaan Penghapusan Akun - [Alamat Email Anda]</p>
                            </div>
                            <p className="mt-3 text-sm">
                                Sertakan dalam email: Nama lengkap, alamat email yang terdaftar, dan alasan penghapusan (opsional). Kami akan memverifikasi identitas Anda sebelum memproses permintaan.
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-6 mb-2">Metode 3: Melalui Formulir Online</h3>
                            <p>
                                Kunjungi <a href="https://official.id/support" className="text-[#2D7C88] hover:underline">https://official.id/support</a> dan pilih "Permintaan Penghapusan Akun" dari kategori yang tersedia.
                            </p>
                        </section>

                        {/* 3. Verification Process */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Proses Verifikasi</h2>
                            <p>
                                Untuk melindungi akun Anda dari penghapusan yang tidak sah, kami akan memverifikasi identitas Anda melalui:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Konfirmasi melalui email terdaftar</li>
                                <li>Verifikasi password atau kode OTP</li>
                                <li>Pertanyaan keamanan (jika berlaku)</li>
                            </ul>
                            <p className="mt-3">
                                Jika Anda tidak dapat mengakses akun Anda, hubungi <a href="mailto:support@official.id" className="text-[#2D7C88] hover:underline">support@official.id</a> dengan bukti kepemilikan akun.
                            </p>
                        </section>

                        {/* 4. What Data Will Be Deleted */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Data yang Akan Dihapus</h2>
                            <p>
                                Ketika akun Anda dihapus dari <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>, data berikut akan dihapus secara permanen:
                            </p>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Data yang Dihapus</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Informasi profil (nama, foto, gelar, kontak)</li>
                                <li>Kartu bisnis digital dan semua konten terkait</li>
                                <li>Preferensi dan pengaturan akun</li>
                                <li>Riwayat aktivitas dan log penggunaan</li>
                                <li>Koneksi dan daftar kontak yang disimpan</li>
                                <li>Data organisasi yang Anda kelola (jika Anda pemilik tunggal)</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">Data yang Mungkin Dipertahankan</h3>
                            <p>Sebagian data mungkin dipertahankan untuk:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li><strong>Kewajiban Hukum:</strong> Catatan transaksi pembayaran (sesuai peraturan perpajakan)</li>
                                <li><strong>Kepentingan Sah:</strong> Log keamanan untuk mencegah penyalahgunaan</li>
                                <li><strong>Sengketa Hukum:</strong> Data yang diperlukan untuk proses hukum yang sedang berlangsung</li>
                            </ul>
                            <p className="mt-3 text-sm text-gray-500">
                                Data yang dipertahankan akan disimpan dalam format terenkripsi dan dihapus setelah periode retensi yang diwajibkan berakhir.
                            </p>
                        </section>

                        {/* 5. Timeline */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Jangka Waktu Penghapusan</h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <table className="w-full text-sm">
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="py-3 font-medium">Permintaan Diterima</td>
                                            <td className="py-3">Konfirmasi dalam 1-3 hari kerja</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-3 font-medium">Periode Grace (Cooling-off)</td>
                                            <td className="py-3">14 hari untuk membatalkan permintaan</td>
                                        </tr>
                                        <tr className="border-b">
                                            <td className="py-3 font-medium">Penghapusan Data</td>
                                            <td className="py-3">Dalam 30 hari setelah periode grace</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 font-medium">Penghapusan dari Backup</td>
                                            <td className="py-3">Dalam 90 hari</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-4 text-sm">
                                Sesuai GDPR, kami akan menyelesaikan permintaan penghapusan dalam waktu maksimal 30 hari. Jika diperlukan perpanjangan (hingga 60 hari tambahan), kami akan memberitahu Anda alasannya.
                            </p>
                        </section>

                        {/* 6. Grace Period */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Periode Grace (Cooling-off Period)</h2>
                            <p>
                                Setelah mengajukan permintaan penghapusan, Anda memiliki waktu <strong>14 hari</strong> untuk membatalkan permintaan tersebut. Selama periode ini:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Akun Anda akan dinonaktifkan tetapi data belum dihapus</li>
                                <li>Kartu bisnis digital Anda tidak akan dapat diakses publik</li>
                                <li>Anda dapat login dan membatalkan penghapusan</li>
                            </ul>
                            <p className="mt-3">
                                Setelah periode grace berakhir, penghapusan akan diproses dan <strong>tidak dapat dibatalkan</strong>.
                            </p>
                        </section>

                        {/* 7. Impact of Deletion */}
                        <section className="bg-amber-50 p-6 rounded-xl border border-amber-200">
                            <h2 className="text-xl font-semibold text-amber-800 mb-4">7. Dampak Penghapusan Akun</h2>
                            <div className="space-y-3 text-amber-900/80">
                                <p>Sebelum menghapus akun di <a href="https://official.id" className="text-amber-700 hover:underline">https://official.id</a>, harap perhatikan:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><strong>Permanen:</strong> Penghapusan bersifat permanen dan tidak dapat dipulihkan</li>
                                    <li><strong>Kartu Bisnis Digital:</strong> Semua kartu bisnis digital Anda akan dihapus dan link menjadi tidak aktif</li>
                                    <li><strong>Koneksi:</strong> Semua koneksi dan data jaringan profesional akan hilang</li>
                                    <li><strong>Langganan:</strong> Langganan premium yang aktif akan dibatalkan tanpa pengembalian dana</li>
                                    <li><strong>Organisasi:</strong> Jika Anda admin/pemilik organisasi, transfer kepemilikan terlebih dahulu</li>
                                    <li><strong>Data Shared:</strong> Data yang telah dibagikan ke pihak lain mungkin tetap ada di sistem mereka</li>
                                </ul>
                            </div>
                        </section>

                        {/* 8. Third-Party Data */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Data pada Layanan Pihak Ketiga</h2>
                            <p>
                                Jika Anda login menggunakan Google atau LinkedIn, penghapusan akun di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> tidak secara otomatis menghapus:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li>
                                    <strong>Google:</strong> Cabut akses Official ID melalui <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Google Account Permissions</a>
                                </li>
                                <li>
                                    <strong>LinkedIn:</strong> Cabut akses melalui <a href="https://www.linkedin.com/psettings/permitted-services" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">LinkedIn Permitted Services</a>
                                </li>
                            </ul>
                            <p className="mt-3">
                                Kami menyarankan Anda untuk mencabut akses aplikasi pada platform tersebut setelah menghapus akun Official ID.
                            </p>
                        </section>

                        {/* 9. Data Portability */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Mengunduh Data Sebelum Penghapusan</h2>
                            <p>
                                Sebelum menghapus akun, Anda berhak untuk mengunduh salinan data pribadi Anda (Hak Portabilitas Data - GDPR Pasal 20). Untuk mengunduh data:
                            </p>
                            <ol className="list-decimal pl-5 space-y-2 mt-3">
                                <li>Login ke akun Anda di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></li>
                                <li>Buka <strong>Pengaturan</strong> → <strong>Privasi</strong></li>
                                <li>Pilih <strong>Unduh Data Saya</strong></li>
                                <li>Data akan disiapkan dalam format JSON/CSV dan dikirim ke email Anda</li>
                            </ol>
                            <p className="mt-3 text-sm">
                                Atau kirim permintaan ke <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a> dengan subjek "Permintaan Portabilitas Data".
                            </p>
                        </section>

                        {/* 10. Platform Compliance */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Kepatuhan Platform</h2>
                            <p>
                                Kebijakan penghapusan akun <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a> mematuhi persyaratan berikut:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-3">
                                <li>
                                    <strong>Google Play:</strong> <a href="https://support.google.com/googleplay/android-developer/answer/13327111" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Data Deletion Requirements</a> - Pengguna harus dapat meminta penghapusan data dari dalam dan luar aplikasi
                                </li>
                                <li>
                                    <strong>Apple App Store:</strong> Menyediakan opsi penghapusan akun yang mudah diakses
                                </li>
                                <li>
                                    <strong>Meta:</strong> <a href="https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback" target="_blank" rel="noopener noreferrer" className="text-[#2D7C88] hover:underline">Data Deletion Callback</a> requirements
                                </li>
                                <li>
                                    <strong>LinkedIn:</strong> Kepatuhan terhadap LinkedIn API Terms dan privasi pengguna
                                </li>
                            </ul>
                        </section>

                        {/* 11. Special Cases */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Situasi Khusus</h2>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">11.1 Akun Organisasi</h3>
                            <p>
                                Jika Anda adalah pemilik atau admin organisasi di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Transfer kepemilikan organisasi ke admin lain sebelum menghapus akun</li>
                                <li>Jika tidak ada admin lain, organisasi akan dihapus bersama akun Anda</li>
                                <li>Anggota organisasi akan kehilangan akses ke fitur organisasi tersebut</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">11.2 Akun dengan Langganan Aktif</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Langganan akan dibatalkan secara otomatis</li>
                                <li>Tidak ada pengembalian dana untuk sisa periode langganan</li>
                                <li>Pembayaran yang terjadwal akan dibatalkan</li>
                            </ul>

                            <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">11.3 Akun yang Dibekukan/Dibanned</h3>
                            <p>
                                Jika akun Anda dibekukan karena pelanggaran syarat layanan, Anda tetap dapat mengajukan permintaan penghapusan data melalui email ke <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a>.
                            </p>
                        </section>

                        {/* 12. Appeals */}
                        <section>
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Penolakan dan Banding</h2>
                            <p>
                                Dalam kasus tertentu, kami mungkin menolak atau menunda permintaan penghapusan jika:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-3">
                                <li>Data diperlukan untuk menyelesaikan transaksi atau kontrak</li>
                                <li>Ada kewajiban hukum untuk menyimpan data</li>
                                <li>Data diperlukan untuk pembelaan hukum</li>
                                <li>Terdapat sengketa aktif yang melibatkan akun Anda</li>
                            </ul>
                            <p className="mt-3">
                                Jika permintaan Anda ditolak, kami akan menjelaskan alasannya. Anda berhak mengajukan banding dengan menghubungi <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a> atau mengajukan keluhan ke otoritas perlindungan data.
                            </p>
                        </section>

                        {/* 13. Contact */}
                        <section className="bg-[#2D7C88]/5 p-6 rounded-xl border border-[#2D7C88]/20">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Hubungi Kami</h2>
                            <p>
                                Untuk pertanyaan tentang penghapusan akun atau data pribadi Anda di <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a>:
                            </p>
                            <div className="mt-4 space-y-2">
                                <p><strong>Official ID</strong></p>
                                <p>Website: <a href="https://official.id" className="text-[#2D7C88] hover:underline">https://official.id</a></p>
                                <p>Email Privasi: <a href="mailto:privacy@official.id" className="text-[#2D7C88] hover:underline">privacy@official.id</a></p>
                                <p>Email Dukungan: <a href="mailto:support@official.id" className="text-[#2D7C88] hover:underline">support@official.id</a></p>
                            </div>
                            <p className="mt-4 text-sm">
                                Waktu respons: 1-3 hari kerja untuk permintaan standar.
                            </p>
                        </section>

                        {/* Related Links */}
                        <section className="border-t pt-6">
                            <p className="text-sm text-gray-500">
                                Lihat juga: <Link href="/privacy-policy" className="text-[#2D7C88] hover:underline">Kebijakan Privasi</Link> | <Link href="/terms" className="text-[#2D7C88] hover:underline">Syarat dan Ketentuan</Link>
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
