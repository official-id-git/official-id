// Simple in-memory rate limiter for API routes
// In production, consider using Redis for distributed rate limiting

interface RateLimitEntry {
    count: number
    resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < now) {
            rateLimitStore.delete(key)
        }
    }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
    maxRequests: number
    windowMs: number
}

export interface RateLimitResult {
    success: boolean
    remaining: number
    resetTime: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and remaining requests
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const key = identifier

    const entry = rateLimitStore.get(key)

    // No existing entry or expired
    if (!entry || entry.resetTime < now) {
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + config.windowMs
        })
        return {
            success: true,
            remaining: config.maxRequests - 1,
            resetTime: now + config.windowMs
        }
    }

    // Entry exists and still valid
    if (entry.count >= config.maxRequests) {
        return {
            success: false,
            remaining: 0,
            resetTime: entry.resetTime
        }
    }

    // Increment count
    entry.count++
    return {
        success: true,
        remaining: config.maxRequests - entry.count,
        resetTime: entry.resetTime
    }
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
    const forwardedFor = request.headers.get('x-forwarded-for')
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim()
    }

    const realIP = request.headers.get('x-real-ip')
    if (realIP) {
        return realIP
    }

    return 'unknown'
}

// Predefined rate limit configs
export const RATE_LIMITS = {
    // Public form submission: 10 requests per minute
    PUBLIC_FORM: { maxRequests: 10, windowMs: 60 * 1000 },
    // Public list view: 30 requests per minute
    PUBLIC_VIEW: { maxRequests: 30, windowMs: 60 * 1000 },
    // Authenticated actions: 60 requests per minute
    AUTHENTICATED: { maxRequests: 60, windowMs: 60 * 1000 }
} as const
