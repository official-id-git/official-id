import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export type ThreatType = 'SQLi' | 'XSS' | 'Malicious Patterns'

export interface ThreatLog {
    payload: string
    eventType: ThreatType
    path: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
}

export const useSecurity = () => {
    const supabase = createClient() as any
    const { user } = useAuth()
    const [isBlocking, setIsBlocking] = useState(false)

    // Regex patterns for detection
    const patterns = {
        SQLi: [
            /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Basic comments and quotes
            /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i, // Equality checks with termination
            /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i, // Classic ' OR ' patterns
            /((\%27)|(\'))union/i, // UNION
            /exec(\s|\+)+(s|x)p\w+/i, // exec sp_
            /UNION(\s|\+)+SELECT/i, // UNION SELECT
            /DROP(\s|\+)+TABLE/i, // DROP TABLE
            /INSERT(\s|\+)+INTO/i,  // INSERT INTO
            /UPDATE(\s|\+)+SET/i, // UPDATE SET
            /DELETE(\s|\+)+FROM/i, // DELETE FROM
        ],
        XSS: [
            /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i, // Basic tags
            /((\%3C)|<)((\%69)|i|(\%49))((\%6D)|m|(\%4D))((\%67)|g|(\%47))[^\n]+((\%3E)|>)/i, // <img> tags
            /((\%3C)|<)[^\n]+((\%3E)|>)/i, // General tags
            /javascript:/i, // javascript: protocol
            /onload=/i, // onload handler
            /onerror=/i, // onerror handler
            /onclick=/i, // onclick handler
            /onmouseover=/i, // onmouseover
            /eval\(/i, // eval()
            /alert\(/i, // alert()
        ]
    }

    const detectThreat = useCallback((input: string): ThreatType | null => {
        if (!input) return null

        // Check SQLi
        for (const pattern of patterns.SQLi) {
            if (pattern.test(input)) return 'SQLi'
        }

        // Check XSS
        for (const pattern of patterns.XSS) {
            if (pattern.test(input)) return 'XSS'
        }

        return null
    }, [])

    const logThreat = useCallback(async (threat: ThreatLog) => {
        try {
            // Get basic device info
            const ua = window.navigator.userAgent

            // Get IP (simulated or handled by backend functions/RLS usually, but passed here if we had service)
            // Since we are client-side, we can't reliably get the IP of the user without an external service.
            // Supabase Edge Functions or RLS `current_setting('request.headers')::json->>'x-forwarded-for'` is better for IP.
            // We will just send what we have.

            // Using 'any' cast to bypass type checking for new table not yet in types
            await supabase.from('xploit_potential_log' as any).insert({
                payload: threat.payload, // Consider hashing or truncating sensitive data
                event_type: threat.eventType,
                path: window.location.pathname,
                user_agent: ua,
                user_id: user?.id || null,
                severity: threat.severity || 'high',
                metadata: {
                    timestamp: new Date().toISOString(),
                    url: window.location.href
                }
            })

            console.warn(`Security Alert: ${threat.eventType} detected and logged.`)
        } catch (error) {
            // Fail silently to the user, but log to console in dev
            console.error('Failed to log security threat', error)
        }
    }, [supabase, user])

    const validateInput = useCallback(async (input: string): Promise<boolean> => {
        const threatType = detectThreat(input)
        if (threatType) {
            setIsBlocking(true)
            await logThreat({
                payload: input,
                eventType: threatType,
                path: window.location.pathname,
                severity: 'high'
            })
            setIsBlocking(false)
            return false
        }
        return true
    }, [detectThreat, logThreat])

    return {
        detectThreat,
        logThreat,
        validateInput,
        isBlocking
    }
}
