'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function UserDebug() {
    const [debugData, setDebugData] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    const checkProfile = async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setDebugData('No Auth User')
                return
            }

            const { data, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single()

            if (dbError) {
                setError(dbError)
            } else {
                setDebugData(data)
            }
        } catch (e) {
            setError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg my-4 text-xs font-mono">
            <h3 className="font-bold mb-2">🕵️‍♂️ DEBUG ROLE</h3>
            <button
                onClick={checkProfile}
                className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 rounded mb-2"
                disabled={loading}
            >
                {loading ? 'Checking...' : 'Check DB Profile'}
            </button>

            {error && (
                <div className="text-red-600 mb-2">
                    ERROR: {JSON.stringify(error, null, 2)}
                </div>
            )}

            {debugData && (
                <div className="bg-white p-2 rounded border overflow-auto max-h-40">
                    <pre>{JSON.stringify(debugData, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}
