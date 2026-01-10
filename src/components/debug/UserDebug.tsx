'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserDebugProps {
    userId: string
    onClose: () => void
}

export function UserDebug({ userId, onClose }: UserDebugProps) {
    const [debugData, setDebugData] = useState<any>(null)
    const [error, setError] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        checkProfile()
    }, [userId])

    const checkProfile = async () => {
        setLoading(true)
        setError(null)
        try {
            // 1. Fetch from public.users
            const { data: publicUser, error: dbError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            if (dbError) {
                console.error('Debug DB Error:', dbError)
                setError(dbError)
            }

            setDebugData({
                publicUser,
                timestamp: new Date().toISOString()
            })

        } catch (e: any) {
            setError(e)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">🕵️‍♂️ User Debugger</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="flex gap-2 mb-4">
                    <button
                        onClick={checkProfile}
                        className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm font-medium"
                        disabled={loading}
                    >
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <span className="text-xs text-gray-400 self-center">UserID: {userId}</span>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4 text-sm font-mono">
                        <strong>Error:</strong> {JSON.stringify(error, null, 2)}
                    </div>
                )}

                {debugData && (
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Public Profile (public.users)</h4>
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-auto">
                                <pre className="text-xs font-mono text-gray-800">
                                    {JSON.stringify(debugData.publicUser, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
