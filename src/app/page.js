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
          <div className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold mb-6">
            ✨ Free & Open Source
          </div>
          <h2 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Collaborate in <span className="text-indigo-600">Real-Time</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create, share, and collaborate on whiteboards with your team. 
            Draw, sketch, and brainstorm together in real-time with powerful tools.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-block px-8 py-4 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free →
            </Link>
            <Link
              href="/signin"
              className="inline-block px-8 py-4 bg-white text-indigo-600 text-lg rounded-lg hover:bg-gray-50 font-semibold shadow-lg border-2 border-indigo-600 transition-all"
            >
              Sign In
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">✅ No credit card required • ✅ Unlimited boards</p>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-2xl mb-4">✏️</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Draw & Sketch</h3>
            <p className="text-gray-600 leading-relaxed">
              Powerful drawing tools with shapes, lines, text, and freehand drawing. Everything you need to visualize ideas.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Real-Time Collaboration</h3>
            <p className="text-gray-600 leading-relaxed">
              Work together with your team in real-time. See live cursors and changes as they happen instantly.
            </p>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl mb-4">💾</div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">Auto-Save & Export</h3>
            <p className="text-gray-600 leading-relaxed">
              Never lose your work with automatic snapshots every 30 seconds. Export to PNG, SVG, or JSON.
            </p>
          </div>
        </div>

        <div className="mt-24 bg-white rounded-2xl shadow-xl p-12 max-w-4xl mx-auto text-center border border-gray-100">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h3>
          <p className="text-gray-600 mb-8 text-lg">Join thousands of teams collaborating on whiteboards</p>
          <Link
            href="/signup"
            className="inline-block px-10 py-4 bg-indigo-600 text-white text-lg rounded-lg hover:bg-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Create Your First Board →
          </Link>
        </div>
      </main>
    </div>
  )
}
