'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/LoadingSpinner'

const WhiteboardCanvas = dynamic(
  () => import('@/components/WhiteboardCanvas'),
  { ssr: false }
)

export default function BoardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showShareModal, setShowShareModal] = useState(false)
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [collaboratorRole, setCollaboratorRole] = useState('editor')

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    loadBoard()
  }, [user, params.id, router])

  const loadBoard = async () => {
    if (!user) return
    
    try {
      const boardRes = await fetch(`/api/boards?userId=${user.userId}`)
      const boards = await boardRes.json()
      const board = boards.find(b => b.id === params.id)
      
      if (!board) {
        toast.error('Board not found')
        router.push('/dashboard')
        return
      }

      setBoard(board)
    } catch (error) {
      toast.error('Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  const addCollaborator = async (e) => {
    e.preventDefault()
    if (!collaboratorEmail.trim()) return

    try {
      const res = await fetch('/api/collaborations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boardId: params.id,
          userEmail: collaboratorEmail,
          role: collaboratorRole,
          ownerId: user.userId
        })
      })

      if (res.ok) {
        toast.success('Collaborator added!')
        setShowShareModal(false)
        setCollaboratorEmail('')
        loadBoard()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to add collaborator')
      }
    } catch (error) {
      toast.error('Failed to add collaborator')
    }
  }

  const copyShareLink = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
  }

  if (loading) {
    return <LoadingSpinner message="Loading board..." />
  }

  if (!board) return null

  const isOwner = board.ownerId === user.userId
  const userRole = isOwner ? 'owner' : board.collaborators?.find(c => c.userId === user.userId)?.role

  return (
    <div className="relative h-screen">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 items-center">
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          ← Dashboard
        </Link>
        
        <div className="px-4 py-2 bg-white border-2 border-indigo-200 rounded-lg text-sm font-semibold shadow-md flex items-center gap-2">
          <span className="text-indigo-600">🎨</span>
          <span className="text-gray-900">{board.title}</span>
          {isOwner && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Owner</span>}
          {userRole === 'editor' && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Editor</span>}
          {userRole === 'viewer' && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Viewer</span>}
        </div>

        {isOwner && (
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            👥 Share
          </button>
        )}

        <button
          onClick={copyShareLink}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          🔗 Copy Link
        </button>
      </div>

      {userRole === 'viewer' && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-sm font-medium shadow-md flex items-center gap-2">
          <span>⚠️</span>
          <span>View-only mode - You cannot edit this board</span>
        </div>
      )}

      <WhiteboardCanvas key={params.id} boardId={params.id} />

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Share Board</h3>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Share link:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            <form onSubmit={addCollaborator} className="mb-4">
              <label className="block text-sm font-medium mb-2">Add collaborator:</label>
              <input
                type="email"
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
              />
              
              <select
                value={collaboratorRole}
                onChange={(e) => setCollaboratorRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-3"
              >
                <option value="editor">Editor (can edit)</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 mb-3"
              >
                Add
              </button>
            </form>

            {board.collaborators?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium mb-2">Collaborators:</p>
                <div className="space-y-2">
                  {board.collaborators.map((collab) => (
                    <div key={collab.id} className="flex justify-between items-center text-sm">
                      <span>{collab.user.email} ({collab.role})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
