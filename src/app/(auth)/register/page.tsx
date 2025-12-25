'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client' // Import tambahan untuk handle manual

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()
  const supabase = createClient() // Inisialisasi client

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Password tidak sama')
      return
    }

    if (password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }

    setIsLoading(true)

    try {
      await signUp(email, password, fullName)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Silakan coba lagi.')
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

  // --- PERBAIKAN LOGIKA REGISTER DENGAN LINKEDIN ---
  const handleLinkedInLogin = async () => {
    try {
      setIsLoading(true)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          // Sesuaikan URL callback
          redirectTo: `${window.location.origin}/api/auth/callback`,
          // PENTING: Sertakan scope w_member_social saat daftar juga
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-gray-600 mb-6">
            Silakan cek email Anda untuk verifikasi akun.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-3 text-white rounded-xl font-medium transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #2D7C88 0%, #236B76 100%)',
              boxShadow: '0 10px 25px rgba(45, 124, 136, 0.3)'
            }}
          >
            Ke Halaman Login
          </Link>
        </div>
      </div>
    )
  }

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

          {/* Benefits */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Mengapa bergabung?</h2>
            
            <div className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 rounded-lg bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Gratis Selamanya</h3>
                <p className="text-teal-100 text-sm">Buat kartu bisnis digital tanpa biaya</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 rounded-lg bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">QR Code Instan</h3>
                <p className="text-teal-100 text-sm">Bagikan profil dengan scan QR code</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 rounded-lg bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Jaringan Profesional</h3>
                <p className="text-teal-100 text-sm">Terhubung dengan ribuan profesional</p>
              </div>
            </div>

            <div className="flex items-start gap-4 group cursor-pointer">
              <div className="p-2 rounded-lg bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Organisasi & Tim</h3>
                <p className="text-teal-100 text-sm">Kelola tim dengan mudah (Pro)</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div 
            className="backdrop-blur-sm rounded-xl p-6"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <p className="italic mb-4">"Official ID membantu saya terhubung dengan klien baru dengan cara yang profesional dan modern."</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <span className="font-bold">AS</span>
              </div>
              <div>
                <p className="font-semibold">Andi Susanto</p>
                <p className="text-teal-100 text-sm">Business Consultant</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image 
              src="/logo.png" 
              alt="Official ID Logo" 
              width={64}
              height={64}
            />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Buat Akun Baru</h2>
            <p className="text-gray-500">Bergabung dengan Official ID</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name Input */}
            <div>
              <label htmlFor="fullName" className="block mb-2 text-gray-700 font-medium">
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-[#2D7C88]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7C88] focus:border-transparent transition-all hover:border-gray-400"
                  required
                />
              </div>
            </div>

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
              <label htmlFor="password" className="block mb-2 text-gray-700 font-medium">
                Password
              </label>
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
                  placeholder="Minimal 6 karakter"
                  className="w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2D7C88] focus:border-transparent transition-all hover:border-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                >
                  {showPassword ? (
                    <svg className="