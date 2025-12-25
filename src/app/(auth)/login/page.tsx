'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client' // Import tambahan untuk handle manual login LinkedIn

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signIn, signInWithGoogle } = useAuth()
  const router = useRouter()
  const supabase = createClient() // Inisialisasi Supabase Client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa email dan password Anda.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google')
    }
  }

  // --- PERBAIKAN UTAMA: LOGIKA MANUAL UNTUK LINKEDIN ---
  const handleLinkedInLogin = async () => {
    try {
      setIsLoading(true) // Tambahkan indikator loading
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          // Ganti 'window.location.origin' agar dinamis sesuai environment (Vercel/Localhost)
          redirectTo: `${window.location.origin}/api/auth/callback`,
          // PENTING: Memaksa scope w_member_social agar muncul popup izin posting
          scopes: 'openid profile email w_member_social', 
        },
      })

      if (error) throw error
      
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan LinkedIn')
      setIsLoading(false)
    }
  }
  // --- AKHIR PERBAIKAN ---

  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Left Side - Branding & Info */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #2D7C88 0%, #236B76 50%, #1A5A66 100%)'
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-32 right-32 w-24 h-16 bg-[#E8BC66] rounded-lg rotate-45"></div>
          <div className="absolute bottom-40 left-20 w-24 h-16 bg-[#7A9B6E] rounded-lg rotate-12"></div>
          <div className="absolute top-1/2 right-20 w-20 h-14 bg-[#D1746B] rounded-lg -rotate-12"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4 mb-6">
            <Image 
              src="/logo.png" 
              alt="Official ID Logo" 
              width={80}
              height={80}
              className="cursor-pointer hover:scale-110 transition-transform"
            />
            <div>
              <h1 className="text-5xl mb-2 tracking-tight font-bold">Official ID</h1>
              <p className="text-teal-100 text-lg">Ekosistem Digital untuk Profesional</p>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 group cursor-pointer">
              <div 
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'rgba(232, 188, 102, 0.2)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl mb-1 group-hover:text-white transition-colors font-semibold">Kartu Bisnis Digital</h3>
                <p className="text-teal-100 group-hover:text-teal-50 transition-colors">Buat profil profesional yang mudah dibagikan</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <div 
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'rgba(122, 155, 110, 0.2)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl mb-1 group-hover:text-white transition-colors font-semibold">Networking Tanpa Batas</h3>
                <p className="text-teal-100 group-hover:text-teal-50 transition-colors">Terhubung dengan ribuan profesional lainnya</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <div 
                className="p-3 rounded-xl transition-colors"
                style={{ backgroundColor: 'rgba(209, 116, 107, 0.2)' }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl mb-1 group-hover:text-white transition-colors font-semibold">Verifikasi & Kredibilitas</h3>
                <p className="text-teal-100 group-hover:text-teal-50 transition-colors">Tingkatkan kepercayaan dengan profil terverifikasi</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div 
              className="backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: 'rgba(232, 188, 102, 0.15)' }}
            >
              <div className="text-3xl mb-1 font-bold">10K+</div>
              <div className="text-teal-100 text-sm">Pengguna</div>
            </div>
            <div 
              className="backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: 'rgba(122, 155, 110, 0.15)' }}
            >
              <div className="text-3xl mb-1 font-bold">50K+</div>
              <div className="text-teal-100 text-sm">Koneksi</div>
            </div>
            <div 
              className="backdrop-blur-sm rounded-xl p-4 text-center cursor-pointer hover:scale-105 transition-transform"
              style={{ backgroundColor: 'rgba(209, 116, 107, 0.15)' }}
            >
              <div className="text-3xl mb-1 font-bold">500+</div>
              <div className="text-teal-100 text-sm">Organisasi</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Image 
              src="/logo.png" 
              alt="Official ID Logo" 
              width={64}
              height={64}
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Selamat Datang!</h2>
            <p className="text-gray-500">Masuk ke akun Official ID Anda</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block mb-2 text-gray-700 font-medium">
                Email
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D7C88]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7C88] focus:border-transparent transition-all hover:border-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="text-gray-700 font-medium">
                  Password
                </label>
                <Link href="#" className="text-sm text-[#2D7C88] hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D7C88]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7C88] focus:border-transparent transition-all hover:border-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 font-medium"
              style={{
                background: 'linear-gradient(135deg, #2D7C88 0%, #236B76 100%)',
                boxShadow: '0 10px 25px rgba(45, 124, 136, 0.3)'
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Memproses...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="px-4 text-gray-500 text-sm">Atau lanjutkan dengan</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="group-hover:text-gray-900 transition font-medium">Lanjutkan dengan Google</span>
          </button>

          {/* LinkedIn Login */}
          <button
            onClick={handleLinkedInLogin}
            className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-gray-200 rounded-xl hover:bg-[#0077B5] hover:border-[#0077B5] hover:text-white transition-all duration-200 group mt-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span className="transition font-medium group-hover:text-white">Lanjutkan dengan LinkedIn</span>
          </button>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-[#2D7C88] hover:underline font-medium">
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}