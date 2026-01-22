import { z } from 'zod'

// Helper function to sanitize HTML/XSS
function sanitizeText(text: string): string {
    return text
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim()
}

// Schema for creating a new ngabsen event (authenticated)
export const createNgabsenSchema = z.object({
    nama_acara: z.string()
        .min(3, 'Nama acara minimal 3 karakter')
        .max(200, 'Nama acara maksimal 200 karakter')
        .transform(sanitizeText),
    deskripsi_acara: z.string()
        .max(1000, 'Deskripsi maksimal 1000 karakter')
        .transform(sanitizeText)
        .optional()
        .nullable()
})

// Schema for updating ngabsen event
export const updateNgabsenSchema = z.object({
    nama_acara: z.string()
        .min(3, 'Nama acara minimal 3 karakter')
        .max(200, 'Nama acara maksimal 200 karakter')
        .transform(sanitizeText)
        .optional(),
    deskripsi_acara: z.string()
        .max(1000, 'Deskripsi maksimal 1000 karakter')
        .transform(sanitizeText)
        .optional()
        .nullable()
})

// Schema for public registration (no auth required - extra strict validation)
export const pendaftaranSchema = z.object({
    link_pendaftaran: z.string()
        .min(1, 'Link pendaftaran diperlukan')
        .max(100, 'Link tidak valid'),
    nama_peserta: z.string()
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter')
        .regex(/^[a-zA-Z\s\.\-']+$/, 'Nama hanya boleh mengandung huruf, spasi, titik, dan tanda hubung')
        .transform(sanitizeText),
    deskripsi: z.string()
        .max(500, 'Deskripsi maksimal 500 karakter')
        .transform(sanitizeText)
        .optional()
        .nullable(),
    email: z.string()
        .email('Format email tidak valid')
        .max(100, 'Email terlalu panjang')
        .transform((val) => val.toLowerCase().trim()),
    no_whatsapp: z.string()
        .regex(/^(\+62|62|0)8[1-9][0-9]{7,11}$/, 'Format nomor WhatsApp tidak valid (contoh: 08123456789)')
        .max(20, 'Nomor terlalu panjang')
        .transform((val) => val.replace(/\s/g, '')) // Remove spaces
})

// Types derived from schemas
export type CreateNgabsenInput = z.infer<typeof createNgabsenSchema>
export type UpdateNgabsenInput = z.infer<typeof updateNgabsenSchema>
export type PendaftaranInput = z.infer<typeof pendaftaranSchema>
