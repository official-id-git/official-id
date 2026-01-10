'use client'

import React from 'react'
import Image from 'next/image'
import { Mail, Phone, Globe, MapPin, Linkedin, Twitter, Github, Instagram, Facebook } from 'lucide-react'
import type { BusinessCard } from '@/types'
import PixelBlast from '@/components/effects/PixelBlast'
import FaultyTerminal from '@/components/effects/FaultyTerminal'
import LightRays from '@/components/effects/LightRays'
import Dither from '@/components/effects/Dither'

interface TemplateProps {
    card: BusinessCard
    visibleFields: Record<string, boolean>
    socialLinks: Record<string, string>
    onGenerateVCard: () => void
    readonly?: boolean
}

const getSocialIcon = (platform: string) => {
    const iconMap: { [key: string]: React.ReactElement } = {
        linkedin: <Linkedin className="w-5 h-5" />,
        twitter: <Twitter className="w-5 h-5" />,
        github: <Github className="w-5 h-5" />,
        instagram: <Instagram className="w-5 h-5" />,
        facebook: <Facebook className="w-5 h-5" />,
        youtube: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>,
        tiktok: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
    }
    return iconMap[platform] || <Globe className="w-5 h-5" />
}

const getLocationDisplay = (card: BusinessCard, visibleFields: Record<string, boolean>) => {
    const address = (card as any).address
    const city = (card as any).city
    const hasAddress = address && address.trim() !== '' && address !== 'belum diisi'
    const hasCity = city && city.trim() !== '' && city !== 'belum diisi'
    const showAddress = visibleFields.address !== false && hasAddress
    const showCity = visibleFields.city !== false && hasCity
    return { address, city, showAddress, showCity, hasAny: showAddress || showCity }
}

// Template 1: MM Batch 8 ITHB - Professional dengan Navy Blue & Gold
export const MMBatch8Card = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden font-sans max-w-md mx-auto">
        {/* Header with PixelBlast Background - Navy Blue dari logo */}
        <div className="relative h-40 overflow-hidden" style={{ backgroundColor: '#1e3a5f' }}>
            <PixelBlast color="#fbbf24" pixelSize={3} variant="square" className="opacity-50" />
            <div className="relative z-10 p-6 flex items-start">
                <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-xl">
                    <Image src="/brand/mmb8_logo.png" alt="MM Batch 8 ITHB" width={96} height={96} className="w-full h-full object-contain" />
                </div>
            </div>
        </div>

        {/* Avatar with glow pulse effect */}
        <div className="relative -mt-16 flex justify-center z-20">
            <div className="relative">
                {/* Animated glow effect */}
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full blur animate-pulse" />

                {card.profile_photo_url ? (
                    <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                        <Image src={card.profile_photo_url} alt={card.full_name} width={128} height={128} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">{card.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-6 bg-white">
            <h1 className="text-xl sm:text-2xl md:text-3xl text-center font-bold text-blue-900 break-words">{card.full_name}</h1>
            {card.job_title && <p className="text-center text-yellow-600 font-semibold mt-2 text-lg">{card.job_title}</p>}
            {card.company && <p className="text-center text-gray-600 mt-1">{card.company}</p>}
            {(card as any).show_business_description !== false && (card as any).business_description && (
                <p className="text-gray-700 text-center mt-3 text-sm italic px-4 max-w-sm mx-auto opacity-80">{(card as any).business_description}</p>
            )}

            <div className="mt-6 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg text-blue-900 hover:bg-blue-100 transition-all border border-blue-200 hover:border-blue-400">
                        <Mail className="w-5 h-5 text-blue-700" />
                        <span className="break-all">{card.email}</span>
                    </a>
                )}
                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-yellow-50 rounded-lg text-gray-800 hover:bg-yellow-100 transition-all border border-yellow-200 hover:border-yellow-400">
                        <Phone className="w-5 h-5 text-yellow-600" />
                        <span>{card.phone}</span>
                    </a>
                )}
                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-800 hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-400">
                        <Globe className="w-5 h-5 text-gray-600" />
                        <span className="break-all">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-800 border border-gray-200">
                            <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="flex flex-col">
                                {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-500 text-sm">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null
                        return (
                            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-700 hover:bg-blue-900 hover:text-white transition-all border border-blue-200 hover:border-transparent">
                                {getSocialIcon(platform)}
                            </a>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        {!readonly && (
            <div className="px-6 pb-6 bg-white">
                <button onClick={onGenerateVCard}
                    className="w-full py-4 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-800 hover:to-blue-600 transition-all shadow-lg hover:shadow-blue-500/50">
                    Simpan Kontak
                </button>
            </div>
        )}
    </div>
)

// Template 2: Kabayan Group - Creative & Energetic dengan Yellow & Black
export const KabayanGroupCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden font-sans max-w-md mx-auto">
        {/* Header with FaultyTerminal Background */}
        <div className="relative h-40 overflow-hidden bg-black">
            <FaultyTerminal tint="#fbbf24" brightness={0.8} className="opacity-80" />
            <div className="relative z-10 p-6 flex items-start">
                <div className="h-16 bg-white rounded-xl px-3 py-1.5 shadow-xl">
                    <Image src="/brand/kabayan_logo.png" alt="Kabayan Group" width={120} height={64} className="h-full w-auto object-contain" />
                </div>
            </div>
        </div>

        {/* Avatar with glow pulse effect - outline hitam */}
        <div className="relative -mt-16 flex justify-center z-20">
            <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full blur animate-pulse" />

                {card.profile_photo_url ? (
                    <div className="relative w-32 h-32 rounded-full border-4 border-black shadow-xl overflow-hidden bg-white">
                        <Image src={card.profile_photo_url} alt={card.full_name} width={128} height={128} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 rounded-full border-4 border-black shadow-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">{card.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Body with centered background image */}
        <div className="relative px-6 pt-4 pb-6 overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none p-8">
                <Image src="/brand/kabayan_bg.png" alt="" width={300} height={300} className="max-w-full max-h-full object-contain" />
            </div>

            <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl md:text-3xl text-center font-bold text-gray-900 break-words">{card.full_name}</h1>
                {card.job_title && <p className="text-center text-yellow-600 font-semibold mt-2 text-lg">{card.job_title}</p>}
                {card.company && <p className="text-center text-gray-600 mt-1">{card.company}</p>}
                {(card as any).show_business_description !== false && (card as any).business_description && (
                    <p className="text-gray-700 text-center mt-3 text-sm italic px-4 max-w-sm mx-auto opacity-80">{(card as any).business_description}</p>
                )}

                <div className="mt-6 space-y-3">
                    {visibleFields.email && (
                        <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-yellow-50 rounded-lg text-gray-900 hover:bg-yellow-100 transition-all border border-yellow-300 hover:border-yellow-500">
                            <Mail className="w-5 h-5 text-yellow-600" />
                            <span className="break-all">{card.email}</span>
                        </a>
                    )}
                    {visibleFields.phone && card.phone && (
                        <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-orange-50 rounded-lg text-gray-900 hover:bg-orange-100 transition-all border border-orange-300 hover:border-orange-500">
                            <Phone className="w-5 h-5 text-orange-600" />
                            <span>{card.phone}</span>
                        </a>
                    )}
                    {visibleFields.website && card.website && (
                        <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 hover:bg-gray-100 transition-all border border-gray-300 hover:border-gray-500">
                            <Globe className="w-5 h-5 text-gray-700" />
                            <span className="break-all">{card.website}</span>
                        </a>
                    )}
                    {(() => {
                        const loc = getLocationDisplay(card, visibleFields)
                        if (!loc.hasAny) return null
                        return (
                            <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg text-gray-900 border border-gray-300">
                                <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                                <div className="flex flex-col">
                                    {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                    {loc.showCity && <span className="text-gray-500 text-sm">{loc.city}</span>}
                                </div>
                            </div>
                        )
                    })()}
                </div>

                {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                    <div className="flex gap-3 mt-4 justify-center flex-wrap">
                        {Object.entries(socialLinks).map(([platform, url]) => {
                            if (!url) return null
                            return (
                                <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                    className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-700 hover:bg-yellow-500 hover:text-white transition-all border border-yellow-300 hover:border-transparent">
                                    {getSocialIcon(platform)}
                                </a>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        {!readonly && (
            <div className="relative px-6 pb-6 z-10">
                <button onClick={onGenerateVCard}
                    className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-bold hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 border-2 border-black">
                    Simpan Kontak
                </button>
            </div>
        )}
    </div>
)

// Template 3: Mickey - Disney Vintage dengan Grayscale
export const MickeyCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gray-50 rounded-2xl shadow-2xl overflow-hidden font-sans max-w-md mx-auto">
        {/* Header with Animated GIF Background */}
        <div className="relative h-40 overflow-hidden bg-gray-900">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://media1.tenor.com/m/BRyhETxvQg8AAAAd/ungodlyhottie.gif"
                    alt="Background Animation"
                    className="w-full h-full object-cover grayscale"
                    style={{ opacity: 0.3 }}
                />
            </div>
            <div className="relative z-10 p-6 flex items-start">
                <div className="w-20 h-20 bg-white rounded-full p-2 shadow-xl">
                    <Image src="/brand/mickey_boat.png" alt="Mickey Mouse" width={80} height={80} className="w-full h-full object-contain" />
                </div>
            </div>
        </div>

        {/* Avatar with rounded square and gray glow pulse */}
        <div className="relative -mt-16 flex justify-center z-20">
            <div className="relative">
                {/* Animated glow effect - abu-abu muda */}
                <div className="absolute -inset-3 bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 rounded-3xl blur-lg animate-pulse" />

                {/* Static inner content */}
                {card.profile_photo_url ? (
                    <div className="relative w-32 h-32 rounded-3xl border-4 border-white shadow-xl overflow-hidden bg-white">
                        <Image src={card.profile_photo_url} alt={card.full_name} width={128} height={128} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">{card.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-6 bg-gray-50">
            <h1 className="text-2xl text-center font-bold text-gray-900 break-words">{card.full_name}</h1>
            {card.job_title && <p className="text-center text-red-600 font-semibold mt-1">{card.job_title}</p>}
            {card.company && <p className="text-center text-gray-600 text-sm mt-1">{card.company}</p>}
            {(card as any).show_business_description !== false && (card as any).business_description && (
                <p className="text-gray-700 text-center mt-3 text-sm italic px-4">{(card as any).business_description}</p>
            )}

            <div className="mt-6 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-all border border-gray-300 shadow-sm">
                        <Mail className="w-5 h-5 text-gray-700" />
                        <span className="break-all text-sm">{card.email}</span>
                    </a>
                )}
                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-all border border-gray-300 shadow-sm">
                        <Phone className="w-5 h-5 text-gray-700" />
                        <span className="text-sm">{card.phone}</span>
                    </a>
                )}
                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-100 transition-all border border-gray-300 shadow-sm">
                        <Globe className="w-5 h-5 text-gray-700" />
                        <span className="break-all text-sm">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 border border-gray-300 shadow-sm">
                            <MapPin className="w-5 h-5 text-red-600 shrink-0" />
                            <div className="flex flex-col">
                                {loc.showAddress && <span className="break-words text-sm">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-500 text-xs">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null
                        return (
                            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                className="w-11 h-11 bg-white rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-800 hover:text-white transition-all border border-gray-300 shadow-sm">
                                {getSocialIcon(platform)}
                            </a>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        {!readonly && (
            <div className="px-6 pb-6 bg-gray-50">
                <button onClick={onGenerateVCard}
                    className="w-full py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-gray-700/50 transform hover:scale-105">
                    Simpan Kontak
                </button>
            </div>
        )}
    </div>
)

// Template 4: Betty Boop - Vintage Cartoon dengan Pink, Red & Peach
export const BettyBoopCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-pink-50 rounded-2xl shadow-2xl overflow-hidden font-sans max-w-md mx-auto relative">
        {/* LightRays Background - jangkauan diperpanjang sampai body */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
            <LightRays
                raysOrigin="top-center"
                raysColor="#ec4899"
                raysSpeed={0.7}
                lightSpread={1.5}
                rayLength={5}
                pulsating={true}
                fadeDistance={3}
                saturation={2}
                followMouse={false}
                mouseInfluence={0}
                noiseAmount={0.05}
                distortion={0.15}
                className=""
            />
        </div>

        {/* Header - empty for spacing */}
        <div className="relative h-32 z-10"></div>

        {/* Betty Boop Character Image - posisi tetap */}
        <div className="relative flex justify-start z-20 pl-5" style={{ marginTop: '-5rem' }}>
            <Image
                src="/brand/betty_boop.png"
                alt="Betty Boop"
                width={112}
                height={112}
                className="h-28 w-auto object-contain drop-shadow-2xl"
            />
        </div>

        {/* Avatar with spinning pink animation - posisi diturunkan setengah */}
        <div className="relative flex justify-center z-20" style={{ marginTop: '-4rem' }}>
            <div className="relative">
                {/* Animated spinning glow effect - pink */}
                <div className="absolute -inset-2 bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 rounded-full opacity-50 blur-sm animate-spin-slow" />

                {/* Static inner content - border merah tua */}
                {card.profile_photo_url ? (
                    <div className="relative w-32 h-32 rounded-full border-4 border-red-700 shadow-xl overflow-hidden bg-white">
                        <Image src={card.profile_photo_url} alt={card.full_name} width={128} height={128} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 rounded-full border-4 border-red-700 shadow-xl bg-gradient-to-br from-pink-400 to-red-500 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">{card.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="relative px-6 pt-4 pb-6 z-10">
            <h1 className="text-2xl text-center font-bold text-pink-900 break-words">{card.full_name}</h1>
            {card.job_title && <p className="text-center text-red-600 font-semibold mt-1">{card.job_title}</p>}
            {card.company && <p className="text-center text-gray-700 text-sm mt-1">{card.company}</p>}
            {(card as any).show_business_description !== false && (card as any).business_description && (
                <p className="text-gray-700 text-center mt-3 text-sm italic px-4">{(card as any).business_description}</p>
            )}

            <div className="mt-6 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-pink-900 hover:bg-pink-100 transition-all border border-pink-300 shadow-sm">
                        <Mail className="w-5 h-5 text-pink-600" />
                        <span className="break-all text-sm">{card.email}</span>
                    </a>
                )}
                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-pink-900 hover:bg-pink-100 transition-all border border-pink-300 shadow-sm">
                        <Phone className="w-5 h-5 text-pink-600" />
                        <span className="text-sm">{card.phone}</span>
                    </a>
                )}
                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-pink-900 hover:bg-pink-100 transition-all border border-pink-300 shadow-sm">
                        <Globe className="w-5 h-5 text-pink-600" />
                        <span className="break-all text-sm">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-pink-900 border border-pink-300 shadow-sm">
                            <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                            <div className="flex flex-col">
                                {loc.showAddress && <span className="break-words text-sm">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-500 text-xs">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null
                        return (
                            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                className="w-11 h-11 bg-white rounded-lg flex items-center justify-center text-pink-600 hover:bg-pink-500 hover:text-white transition-all border border-pink-300 shadow-sm">
                                {getSocialIcon(platform)}
                            </a>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer - padding yang manis */}
        {!readonly && (
            <div className="relative px-8 py-6 bg-pink-200 z-10">
                <button onClick={onGenerateVCard}
                    className="w-full py-3.5 bg-white text-pink-900 rounded-lg font-semibold hover:bg-pink-50 transition-all shadow-lg hover:shadow-xl border-2 border-red-700">
                    Simpan Kontak
                </button>
            </div>
        )}
    </div>
)

// Template 5: Felix The Cat - Classic Black & White dengan Red Accent
export const FelixTheCatCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gray-100 rounded-2xl shadow-2xl overflow-hidden font-sans max-w-md mx-auto relative">
        {/* Dither Background - covers header and body - ukuran diperbesar 30% */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-2xl">
            <Dither
                waveColor={[0.2, 0.2, 0.2]}
                disableAnimation={false}
                enableMouseInteraction={true}
                mouseRadius={0.39}
                colorNum={4}
                waveAmplitude={0.39}
                waveFrequency={3.9}
                waveSpeed={0.065}
            />
        </div>

        {/* Header with Felix image */}
        <div className="relative h-40 z-10">
            <div className="relative p-6 flex items-center">
                <div className="w-20 h-20 bg-white rounded-full p-2 shadow-lg">
                    <Image src="/brand/felix.png" alt="Felix The Cat" width={80} height={80} className="w-full h-full object-contain" />
                </div>
            </div>
        </div>

        {/* Avatar with rounded square and pulse animation */}
        <div className="relative -mt-16 flex justify-center z-20">
            <div className="relative">
                {/* Animated pulse glow effect - black & white gradient */}
                <div className="absolute -inset-3 bg-gradient-to-r from-gray-700 via-gray-900 to-red-600 rounded-3xl blur-lg animate-pulse" />

                {/* Static inner content */}
                {card.profile_photo_url ? (
                    <div className="relative w-32 h-32 rounded-3xl border-4 border-red-600 shadow-xl overflow-hidden bg-white">
                        <Image src={card.profile_photo_url} alt={card.full_name} width={128} height={128} className="w-full h-full object-cover" />
                    </div>
                ) : (
                    <div className="relative w-32 h-32 rounded-3xl border-4 border-red-600 shadow-xl bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">{card.full_name.charAt(0).toUpperCase()}</span>
                    </div>
                )}
            </div>
        </div>

        {/* Body */}
        <div className="relative px-6 pt-4 pb-6 z-10">
            <h1 className="text-2xl text-center font-bold text-gray-900 break-words">{card.full_name}</h1>
            {card.job_title && <p className="text-center text-red-600 font-semibold mt-1">{card.job_title}</p>}
            {card.company && <p className="text-center text-gray-700 text-sm mt-1">{card.company}</p>}
            {(card as any).show_business_description !== false && (card as any).business_description && (
                <p className="text-gray-700 text-center mt-3 text-sm italic px-4">{(card as any).business_description}</p>
            )}

            <div className="mt-6 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-200 transition-all border-2 border-black shadow-sm">
                        <Mail className="w-5 h-5 text-black" />
                        <span className="break-all text-sm">{card.email}</span>
                    </a>
                )}
                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-200 transition-all border-2 border-black shadow-sm">
                        <Phone className="w-5 h-5 text-black" />
                        <span className="text-sm">{card.phone}</span>
                    </a>
                )}
                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 hover:bg-gray-200 transition-all border-2 border-black shadow-sm">
                        <Globe className="w-5 h-5 text-black" />
                        <span className="break-all text-sm">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-lg text-gray-900 border-2 border-black shadow-sm">
                            <MapPin className="w-5 h-5 text-red-600 shrink-0" />
                            <div className="flex flex-col">
                                {loc.showAddress && <span className="break-words text-sm">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-500 text-xs">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-4 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null
                        return (
                            <a key={platform} href={url} target="_blank" rel="noopener noreferrer"
                                className="w-11 h-11 bg-white rounded-lg flex items-center justify-center text-black hover:bg-black hover:text-white transition-all border-2 border-black shadow-sm">
                                {getSocialIcon(platform)}
                            </a>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        {!readonly && (
            <div className="relative px-6 pb-6 z-10">
                <button onClick={onGenerateVCard}
                    className="w-full py-4 bg-gradient-to-r from-black to-gray-900 text-white rounded-lg font-semibold hover:from-gray-900 hover:to-gray-800 transition-all shadow-lg hover:shadow-red-600/50 transform hover:scale-105 border-2 border-red-600">
                    Simpan Kontak
                </button>
            </div>
        )}
    </div>
)
