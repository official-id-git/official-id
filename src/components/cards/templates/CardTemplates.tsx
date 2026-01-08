import React from 'react'
import { Mail, Phone, Globe, Linkedin, Twitter, Github, Instagram, Facebook, MapPin } from 'lucide-react'
import type { BusinessCard } from '@/types'
import Image from 'next/image'

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

// Helper to check if address/city should be shown
const getLocationDisplay = (card: BusinessCard, visibleFields: Record<string, boolean>) => {
    const address = (card as any).address
    const city = (card as any).city
    const hasAddress = address && address.trim() !== '' && address !== 'belum diisi'
    const hasCity = city && city.trim() !== '' && city !== 'belum diisi'
    const showAddress = visibleFields.address !== false && hasAddress
    const showCity = visibleFields.city !== false && hasCity
    return { address, city, showAddress, showCity, hasAny: showAddress || showCity }
}


export const ModernDarkCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans">
        <div className="relative h-32 bg-gradient-to-r from-emerald-400 to-cyan-500 overflow-hidden">
            <div className="absolute inset-0">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent animate-pulse" />
            </div>
        </div>

        <div className="relative -mt-16 px-6 pb-6">
            <div className="flex flex-col items-center">
                {card.profile_photo_url ? (
                    <Image
                        src={card.profile_photo_url}
                        alt={card.full_name}
                        width={128}
                        height={128}
                        className="w-32 h-32 rounded-2xl border-4 border-slate-900 shadow-xl object-cover"
                    />
                ) : (
                    <div className="w-32 h-32 rounded-2xl border-4 border-slate-900 shadow-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                        <span className="text-5xl text-white font-bold">
                            {card.full_name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <h1 className="text-xl sm:text-2xl md:text-3xl text-white mt-4 font-bold text-center break-words">{card.full_name}</h1>
                {card.job_title && <p className="text-emerald-400 mt-2 text-lg font-medium text-center">{card.job_title}</p>}
                {card.company && <p className="text-gray-400 text-center">{card.company}</p>}
                {card.show_business_description !== false && card.business_description && (
                    <p className="text-gray-300 text-center mt-3 text-sm px-4 max-w-sm mx-auto italic opacity-80">
                        {card.business_description}
                    </p>
                )}
            </div>

            <div className="mt-6 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg text-gray-300 hover:bg-slate-700/50 transition-all border border-slate-700 hover:border-emerald-500">
                        <Mail className="w-5 h-5 text-emerald-400" />
                        <span className="break-all">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg text-gray-300 hover:bg-slate-700/50 transition-all border border-slate-700 hover:border-cyan-500">
                        <Phone className="w-5 h-5 text-cyan-400" />
                        <span>{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg text-gray-300 hover:bg-slate-700/50 transition-all border border-slate-700 hover:border-purple-500">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <span className="break-all">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 rounded-lg text-gray-300 border border-slate-700">
                            <MapPin className="w-5 h-5 text-orange-400 shrink-0" />
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
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gradient-to-br hover:from-emerald-400 hover:to-cyan-500 hover:text-white transition-all border border-slate-700 hover:border-transparent"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-6 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-emerald-500/50"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const CreativeCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative font-sans">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full filter blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-400 to-orange-600 rounded-full filter blur-3xl opacity-30 animate-pulse animation-delay-2000" />

        <div className="relative p-8">
            <div className="flex items-start gap-6">
                {card.profile_photo_url ? (
                    <Image
                        src={card.profile_photo_url}
                        alt={card.full_name}
                        width={112}
                        height={112}
                        className="w-28 h-28 rounded-2xl shadow-xl object-cover transform hover:rotate-6 transition-transform"
                    />
                ) : (
                    <div className="w-28 h-28 shrink-0 rounded-2xl shadow-xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex items-center justify-center transform hover:rotate-6 transition-transform">
                        <span className="text-4xl text-white font-bold">
                            {card.full_name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent font-bold break-words">{card.full_name}</h1>
                    {card.job_title && (
                        <p className="text-gray-700 mt-2 text-lg font-semibold">{card.job_title}</p>
                    )}
                    {card.company && (
                        <p className="text-gray-500 mt-1">{card.company}</p>
                    )}
                    {card.show_business_description !== false && card.business_description && (
                        <p className="text-gray-600 mt-3 text-sm italic border-l-2 border-purple-500 pl-3">
                            {card.business_description}
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-8 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-2xl hover:from-pink-100 hover:to-purple-100 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-700 break-all">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl hover:from-yellow-100 hover:to-orange-100 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-700">{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl hover:from-blue-100 hover:to-cyan-100 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-700 break-all">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl">
                            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col text-gray-700">
                                {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-500 text-sm">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-2xl font-medium hover:from-pink-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const MinimalWhiteCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden font-sans">
        <div className="p-8">
            <div className="flex flex-col items-center text-center">
                {card.profile_photo_url ? (
                    <Image
                        src={card.profile_photo_url}
                        alt={card.full_name}
                        width={96}
                        height={96}
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-900"
                    />
                ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-900 flex items-center justify-center">
                        <span className="text-3xl text-white font-semibold">
                            {card.full_name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <h1 className="text-lg sm:text-xl md:text-2xl text-gray-900 mt-4 font-semibold break-words">
                    {card.full_name}
                </h1>
                {card.job_title && (
                    <p className="text-gray-600 mt-2">{card.job_title}</p>
                )}
                {card.company && (
                    <p className="text-gray-500 text-sm mt-1">{card.company}</p>
                )}
                {card.show_business_description !== false && card.business_description && (
                    <p className="text-gray-600 mt-3 text-sm max-w-xs mx-auto italic">
                        "{card.business_description}"
                    </p>
                )}
            </div>

            <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                        <Mail className="w-5 h-5 shrink-0" />
                        <span className="break-all text-sm">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                        <Phone className="w-5 h-5 shrink-0" />
                        <span className="text-sm">{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-gray-900 transition-colors">
                        <Globe className="w-5 h-5 shrink-0" />
                        <span className="break-all text-sm">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 text-gray-700">
                            <MapPin className="w-5 h-5 shrink-0 text-orange-500" />
                            <span className="text-sm">
                                {loc.showAddress && loc.address}
                                {loc.showAddress && loc.showCity && ', '}
                                {loc.showCity && loc.city}
                            </span>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-4 mt-6 justify-center border-t border-gray-200 pt-6 flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const ElegantCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-xl overflow-hidden font-serif">
        <div className="relative h-40 bg-gradient-to-r from-amber-700 to-orange-800 overflow-hidden">
            <div className="absolute inset-0 opacity-30" />
        </div>

        <div className="relative -mt-20 px-8 pb-8">
            {card.profile_photo_url ? (
                <Image
                    src={card.profile_photo_url}
                    alt={card.full_name}
                    width={128}
                    height={128}
                    className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-2xl object-cover"
                />
            ) : (
                <div className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                    <span className="text-5xl text-white font-bold">
                        {card.full_name.charAt(0).toUpperCase()}
                    </span>
                </div>
            )}

            <div className="text-center mt-6">
                <h1 className="text-2xl sm:text-3xl text-amber-900 font-bold break-words">
                    {card.full_name}
                </h1>
                {card.job_title && (
                    <p className="text-amber-700 mt-2 text-lg italic">{card.job_title}</p>
                )}
                {card.company && (
                    <p className="text-amber-600 mt-1">{card.company}</p>
                )}
                {card.show_business_description !== false && card.business_description && (
                    <div className="mt-4 relative px-8">
                        <span className="absolute top-0 left-4 text-4xl text-amber-200 font-serif">"</span>
                        <p className="text-amber-800 text-sm italic relative z-10">
                            {card.business_description}
                        </p>
                        <span className="absolute bottom-0 right-4 text-4xl text-amber-200 font-serif line-height-none">"</span>
                    </div>
                )}
            </div>

            <div className="mt-8 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-all shadow-sm">
                        <div className="w-10 h-10 shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="text-amber-900 break-all">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-all shadow-sm">
                        <div className="w-10 h-10 shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-orange-700" />
                        </div>
                        <span className="text-amber-900">{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white/80 rounded-xl hover:bg-white transition-all shadow-sm">
                        <div className="w-10 h-10 shrink-0 bg-amber-100 rounded-full flex items-center justify-center">
                            <Globe className="w-5 h-5 text-amber-700" />
                        </div>
                        <span className="text-amber-900 break-all">{card.website}</span>
                    </a>
                )}
                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 p-4 bg-white/80 rounded-xl shadow-sm">
                            <div className="w-10 h-10 shrink-0 bg-orange-100 rounded-full flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-orange-700" />
                            </div>
                            <div className="flex flex-col text-amber-900">
                                {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                {loc.showCity && <span className="text-amber-700 text-sm">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-11 h-11 bg-white/80 rounded-full flex items-center justify-center text-amber-700 hover:bg-gradient-to-br hover:from-amber-600 hover:to-orange-700 hover:text-white transition-all shadow-sm"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-amber-700 to-orange-800 text-white rounded-xl font-medium hover:from-amber-800 hover:to-orange-900 transition-all shadow-lg"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const CorporateCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-none shadow-2xl overflow-hidden border-t-4 border-gray-900 font-sans">
        <div className="bg-gray-900 px-8 py-6">
            <div className="flex items-center gap-6">
                {card.profile_photo_url ? (
                    <Image
                        src={card.profile_photo_url}
                        alt={card.full_name}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-sm object-cover border-2 border-gray-700"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-sm bg-gray-700 flex items-center justify-center border-2 border-gray-600">
                        <span className="text-3xl text-white font-bold">
                            {card.full_name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl text-white font-bold break-words">
                        {card.full_name}
                    </h1>
                    {card.job_title && (
                        <p className="text-gray-300 mt-1 font-medium">{card.job_title}</p>
                    )}
                    {card.company && (
                        <p className="text-gray-400 text-sm mt-1">{card.company}</p>
                    )}
                    {card.show_business_description !== false && card.business_description && (
                        <p className="text-gray-300 text-xs mt-2 italic px-2 border-l border-gray-500">
                            {card.business_description}
                        </p>
                    )}
                </div>
            </div>
        </div>

        <div className="px-8 py-6 bg-gray-50">
            <div className="space-y-3">
                {visibleFields.email && (
                    <div className="flex items-center gap-3 py-3 border-b border-gray-200">
                        <Mail className="w-5 h-5 text-gray-600 shrink-0" />
                        <a href={`mailto:${card.email}`} className="text-gray-800 hover:text-gray-900 break-all text-sm">
                            {card.email}
                        </a>
                    </div>
                )}

                {visibleFields.phone && card.phone && (
                    <div className="flex items-center gap-3 py-3 border-b border-gray-200">
                        <Phone className="w-5 h-5 text-gray-600 shrink-0" />
                        <a href={`tel:${card.phone}`} className="text-gray-800 hover:text-gray-900 text-sm">
                            {card.phone}
                        </a>
                    </div>
                )}

                {visibleFields.website && card.website && (
                    <div className="flex items-center gap-3 py-3 border-b border-gray-200">
                        <Globe className="w-5 h-5 text-gray-600 shrink-0" />
                        <a href={card.website} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-gray-900 break-all text-sm">
                            {card.website}
                        </a>
                    </div>
                )}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-10 h-10 bg-gray-200 rounded-sm flex items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition-all"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-6 py-3 bg-gray-900 text-white rounded-sm text-sm font-medium hover:bg-gray-800 transition-colors uppercase tracking-wider"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const TechCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/20 font-sans">
        <div className="relative bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 p-[2px]">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 animate-pulse opacity-75 blur" />
            <div className="relative bg-gray-950 px-6 py-8">
                <div className="flex items-center gap-6">
                    {card.profile_photo_url ? (
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur animate-pulse" />
                            <Image
                                src={card.profile_photo_url}
                                alt={card.full_name}
                                width={96}
                                height={96}
                                className="relative w-24 h-24 rounded-lg object-cover border-2 border-gray-900"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg blur animate-pulse" />
                            <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center border-2 border-gray-900">
                                <span className="text-4xl text-white font-bold">
                                    {card.full_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl text-white uppercase tracking-wider font-bold break-words">
                            {card.full_name}
                        </h1>
                        {card.job_title && (
                            <p className="text-cyan-400 mt-2 uppercase text-sm tracking-wide font-medium">
                                {card.job_title}
                            </p>
                        )}
                        {card.company && (
                            <p className="text-gray-400 text-sm mt-1">{card.company}</p>
                        )}
                        {card.show_business_description !== false && card.business_description && (
                            <p className="text-cyan-200/80 text-xs mt-2 italic bg-gray-900/50 p-2 rounded border-l-2 border-cyan-500">
                                {card.business_description}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 py-6 space-y-3">
            {visibleFields.email && (
                <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-cyan-500/20 hover:border-cyan-500 transition-all group">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-300 break-all text-sm">{card.email}</span>
                </a>
            )}

            {visibleFields.phone && card.phone && (
                <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-cyan-500/20 hover:border-cyan-500 transition-all group">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Phone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">{card.phone}</span>
                </a>
            )}

            {visibleFields.website && card.website && (
                <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-cyan-500/20 hover:border-cyan-500 transition-all group">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Globe className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-300 break-all text-sm">{card.website}</span>
                </a>
            )}

            {(() => {
                const loc = getLocationDisplay(card, visibleFields)
                if (!loc.hasAny) return null
                return (
                    <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg border border-cyan-500/20 hover:border-cyan-500 transition-all group">
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col text-gray-300">
                            {loc.showAddress && <span className="break-words text-sm">{loc.address}</span>}
                            {loc.showCity && <span className="text-cyan-400 text-xs">{loc.city}</span>}
                        </div>
                    </div>
                )
            })()}
        </div>

        {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
            <div className="flex gap-3 px-6 pb-4 justify-center flex-wrap">
                {Object.entries(socialLinks).map(([platform, url]) => {
                    if (!url) return null;
                    return (
                        <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-gray-900/50 rounded-lg border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-gradient-to-br hover:from-cyan-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all"
                        >
                            {getSocialIcon(platform)}
                        </a>
                    );
                })}
            </div>
        )}

        <div className="px-6 pb-6">
            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white rounded-lg uppercase tracking-wider text-sm font-medium hover:from-cyan-600 hover:via-blue-600 hover:to-purple-700 transition-all relative overflow-hidden group"
                >
                    <span className="relative z-10">Simpan Kontak</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            )}
        </div>
    </div>
)

export const ArtisticCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gradient-to-br from-rose-100 via-purple-100 to-indigo-100 rounded-3xl shadow-2xl overflow-hidden relative font-serif">
        <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-10 left-10 w-32 h-32 bg-rose-500 rounded-full filter blur-3xl animate-pulse" />
                <div className="absolute top-1/3 right-10 w-40 h-40 bg-purple-500 rounded-full filter blur-3xl animate-pulse animation-delay-2000" />
                <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-indigo-500 rounded-full filter blur-3xl animate-pulse animation-delay-4000" />
            </div>
        </div>

        <div className="relative p-8">
            <div className="flex flex-col items-center">
                {card.profile_photo_url ? (
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400 rounded-full animate-spin-slow opacity-50 blur-sm" />
                        <Image
                            src={card.profile_photo_url}
                            alt={card.full_name}
                            width={128}
                            height={128}
                            className="relative w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-rose-400 via-purple-400 to-indigo-400 rounded-full animate-spin-slow opacity-50 blur-sm" />
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-rose-500 via-purple-500 to-indigo-600 flex items-center justify-center border-4 border-white shadow-xl">
                            <span className="text-5xl text-white font-bold">
                                {card.full_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}

                <h1 className="text-2xl sm:text-3xl md:text-4xl text-gray-900 mt-6 text-center font-bold break-words">
                    {card.full_name}
                </h1>
                {card.job_title && (
                    <p className="text-purple-700 mt-3 text-xl italic text-center">{card.job_title}</p>
                )}
                {card.company && (
                    <p className="text-gray-600 mt-2 text-center">{card.company}</p>
                )}
                {card.show_business_description !== false && card.business_description && (
                    <div className="mt-4 px-6 text-center">
                        <p className="text-gray-700 italic text-sm font-medium relative inline-block">
                            <span className="absolute -top-2 -left-2 text-2xl text-rose-300">"</span>
                            {card.business_description}
                            <span className="absolute -bottom-2 -right-2 text-2xl text-indigo-300">"</span>
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-8 space-y-4">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white transition-all shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 break-all">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white transition-all shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800">{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl hover:bg-white transition-all shadow-sm">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 break-all">{card.website}</span>
                    </a>
                )}

                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-4 p-4 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col text-gray-800">
                                {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                {loc.showCity && <span className="text-purple-700 text-sm">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-12 h-12 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center text-purple-700 hover:bg-gradient-to-br hover:from-rose-500 hover:via-purple-500 hover:to-indigo-600 hover:text-white transition-all shadow-sm hover:scale-110"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 text-white rounded-2xl font-medium hover:from-rose-600 hover:via-purple-600 hover:to-indigo-700 transition-all shadow-xl text-lg"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const LuxuryCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-xl shadow-2xl overflow-hidden border border-yellow-600/30 font-sans">
        <div className="relative bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 p-[1px]">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600 animate-pulse opacity-50" />
            <div className="relative bg-gray-900 px-8 py-6">
                <div className="flex flex-col items-center">
                    {card.profile_photo_url ? (
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full blur-sm" />
                            <Image
                                src={card.profile_photo_url}
                                alt={card.full_name}
                                width={112}
                                height={112}
                                className="relative w-28 h-28 rounded-full object-cover border-4 border-yellow-600 shadow-xl"
                            />
                        </div>
                    ) : (
                        <div className="relative">
                            <div className="absolute -inset-2 bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full blur-sm" />
                            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-500 flex items-center justify-center border-4 border-yellow-600 shadow-xl">
                                <span className="text-5xl text-gray-900 font-bold">
                                    {card.full_name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>
                    )}

                    <h1 className="text-xl sm:text-2xl md:text-3xl text-yellow-500 mt-4 text-center uppercase tracking-wider font-bold break-words">
                        {card.full_name}
                    </h1>
                    {card.job_title && (
                        <p className="text-yellow-600 mt-2 text-center uppercase text-sm tracking-widest font-bold">
                            {card.job_title}
                        </p>
                    )}
                    {card.company && (
                        <p className="text-gray-400 mt-1 text-center text-sm">{card.company}</p>
                    )}
                    {card.show_business_description !== false && card.business_description && (
                        <p className="text-yellow-600/80 mt-3 text-xs text-center border-y border-yellow-600/20 py-2 max-w-xs mx-auto">
                            {card.business_description}
                        </p>
                    )}
                </div>
            </div>
        </div>

        <div className="px-8 py-6 space-y-3">
            {visibleFields.email && (
                <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30 hover:border-yellow-500 transition-all">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="text-gray-200 break-all text-sm">{card.email}</span>
                </a>
            )}

            {visibleFields.phone && card.phone && (
                <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30 hover:border-yellow-500 transition-all">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="text-gray-200 text-sm">{card.phone}</span>
                </a>
            )}

            {visibleFields.website && card.website && (
                <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30 hover:border-yellow-500 transition-all">
                    <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center">
                        <Globe className="w-5 h-5 text-gray-900" />
                    </div>
                    <span className="text-gray-200 break-all text-sm">{card.website}</span>
                </a>
            )}
            {(() => {
                const loc = getLocationDisplay(card, visibleFields)
                if (!loc.hasAny) return null
                return (
                    <div className="flex items-center gap-3 p-4 bg-gray-800/50 rounded-lg border border-yellow-600/30">
                        <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-yellow-600 to-yellow-500 rounded-lg flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-gray-900" />
                        </div>
                        <div className="flex flex-col text-gray-200">
                            {loc.showAddress && <span className="break-words text-sm">{loc.address}</span>}
                            {loc.showCity && <span className="text-yellow-500 text-xs">{loc.city}</span>}
                        </div>
                    </div>
                )
            })()}
        </div>

        {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
            <div className="flex gap-3 px-8 pb-4 justify-center flex-wrap">
                {Object.entries(socialLinks).map(([platform, url]) => {
                    if (!url) return null;
                    return (
                        <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 bg-gray-800/50 rounded-lg border border-yellow-600/30 flex items-center justify-center text-yellow-500 hover:bg-gradient-to-br hover:from-yellow-600 hover:to-yellow-500 hover:text-gray-900 hover:border-transparent transition-all"
                        >
                            {getSocialIcon(platform)}
                        </a>
                    );
                })}
            </div>
        )}

        <div className="px-8 pb-6">
            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-gray-900 rounded-lg uppercase tracking-widest text-sm font-bold hover:from-yellow-500 hover:to-yellow-600 transition-all shadow-lg hover:shadow-yellow-600/50"
                >
                    Simpan Kontak
                </button>
            )}
        </div>
    </div>
)

export const VibrantCard = ({ card, visibleFields, socialLinks, onGenerateVCard, readonly }: TemplateProps) => (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative font-sans">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 opacity-50" />

        <div className="relative p-8">
            <div className="flex flex-col items-center">
                {card.profile_photo_url ? (
                    <div className="relative">
                        <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl blur-lg animate-pulse" />
                        <Image
                            src={card.profile_photo_url}
                            alt={card.full_name}
                            width={128}
                            height={128}
                            className="relative w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-2xl"
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-3xl blur-lg animate-pulse" />
                        <div className="relative w-32 h-32 rounded-3xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center border-4 border-white shadow-2xl">
                            <span className="text-5xl text-white font-bold">
                                {card.full_name.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                )}

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 mb-2 break-words">
                    {card.full_name}
                </h1>
                {card.job_title && (
                    <p className="text-gray-800 mt-3 text-lg text-center font-semibold">
                        {card.job_title}
                    </p>
                )}
                {card.company && (
                    <p className="text-gray-600 mt-1 text-center">{card.company}</p>
                )}
                {card.show_business_description !== false && card.business_description && (
                    <p className="text-gray-700 mt-3 text-sm text-center italic max-w-sm mx-auto font-medium bg-white/30 p-2 rounded-lg backdrop-blur-sm">
                        "{card.business_description}"
                    </p>
                )}
            </div>

            <div className="mt-8 space-y-3">
                {visibleFields.email && (
                    <a href={`mailto:${card.email}`} className="flex items-center gap-3 p-4 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl hover:from-pink-200 hover:to-purple-200 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 break-all">{card.email}</span>
                    </a>
                )}

                {visibleFields.phone && card.phone && (
                    <a href={`tel:${card.phone}`} className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl hover:from-purple-200 hover:to-blue-200 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Phone className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800">{card.phone}</span>
                    </a>
                )}

                {visibleFields.website && card.website && (
                    <a href={card.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-2xl hover:from-blue-200 hover:to-cyan-200 transition-all group">
                        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                            <Globe className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-gray-800 break-all">{card.website}</span>
                    </a>
                )}

                {(() => {
                    const loc = getLocationDisplay(card, visibleFields)
                    if (!loc.hasAny) return null
                    return (
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-100 to-amber-100 rounded-2xl group">
                            <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex flex-col text-gray-800">
                                {loc.showAddress && <span className="break-words">{loc.address}</span>}
                                {loc.showCity && <span className="text-gray-600 text-sm">{loc.city}</span>}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {visibleFields.social_links && Object.keys(socialLinks).length > 0 && (
                <div className="flex gap-3 mt-6 justify-center flex-wrap">
                    {Object.entries(socialLinks).map(([platform, url]) => {
                        if (!url) return null;
                        return (
                            <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-14 h-14 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg"
                            >
                                {getSocialIcon(platform)}
                            </a>
                        );
                    })}
                </div>
            )}

            {!readonly && (
                <button
                    onClick={onGenerateVCard}
                    className="w-full mt-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white rounded-2xl font-medium hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 transition-all shadow-2xl text-lg"
                >
                    🎉 Simpan Kontak
                </button>
            )}
        </div>
    </div>
)
