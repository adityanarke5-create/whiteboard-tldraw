'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Redirecting to dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-indigo-600">Whiteboard</h1>
        <div className="space-x-4">
          <Link
            href="/signin"
            className="px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Collaborate in Real-Time
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Create, share, and collaborate on whiteboards with your team. 
            Draw, sketch, and brainstorm together in real-time.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-semibold shadow-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">✏️</div>
            <h3 className="text-xl font-semibold mb-2">Draw & Sketch</h3>
            <p className="text-gray-600">
              Powerful drawing tools with shapes, lines, and freehand drawing
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">Real-Time Collaboration</h3>
            <p className="text-gray-600">
              Work together with your team in real-time with live cursors
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-3xl mb-4">💾</div>
            <h3 className="text-xl font-semibold mb-2">Auto-Save</h3>
            <p className="text-gray-600">
              Never lose your work with automatic snapshots and exports
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
