'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

export default function DiagnosticPage() {
  const authContext = useAuth()
  const [renderCount, setRenderCount] = useState(0)

  useEffect(() => {
    setRenderCount(prev => prev + 1)
    console.log('=== DIAGNOSTIC PAGE RENDER #' + (renderCount + 1) + ' ===')
    console.log('Auth Context:', {
      loading: authContext.loading,
      hasUser: !!authContext.user,
      userId: authContext.user?.id,
      userEmail: authContext.user?.email
    })
    console.log('========================')
  }, [authContext.loading, authContext.user, renderCount])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔬 Auth Diagnostic Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Context State</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Loading:</span>
              <span className={`px-3 py-1 rounded ${authContext.loading ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {authContext.loading ? '⏳ TRUE' : '✓ FALSE'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">User:</span>
              <span className={`px-3 py-1 rounded ${authContext.user ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {authContext.user ? '✓ EXISTS' : '✗ NULL'}
              </span>
            </div>

            {authContext.user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">User ID:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {authContext.user.id}
                  </code>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {authContext.user.email}
                  </code>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {authContext.user.full_name}
                  </code>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Render Info</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Render Count:</span>
              <span className="px-3 py-1 rounded bg-blue-100 text-blue-800">
                {renderCount}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Check console for detailed logs on each render
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2 text-yellow-800">
            ⚠️ Expected Behavior
          </h2>
          <ul className="space-y-2 text-sm text-yellow-900">
            <li>✓ First render: <code>loading=true</code>, <code>user=null</code></li>
            <li>✓ After auth init: <code>loading=false</code>, <code>user=null</code> (if not logged in)</li>
            <li>✓ After login: <code>loading=false</code>, <code>user=exists</code></li>
            <li>✗ If stuck at <code>loading=true</code> forever → Provider scope issue</li>
            <li>✗ If console shows different values → Context mismatch</li>
          </ul>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              console.clear()
              console.log('=== MANUAL STATE CHECK ===')
              console.log('Current auth state:', authContext)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log State to Console
          </button>
          
          <a
            href="/dashboard"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Go to Dashboard
          </a>
          
          <a
            href="/login"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    </div>
  )
}
