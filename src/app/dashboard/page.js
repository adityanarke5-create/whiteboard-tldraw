'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function Dashboard() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newBoardTitle, setNewBoardTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    fetchBoards()
  }, [user, router])

  const fetchBoards = async () => {
    if (!user) return
    
    try {
      const res = await fetch(`/api/boards?userId=${user.userId}`)
      const data = await res.json()
      setBoards(data)
    } catch (error) {
      toast.error('Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async (e) => {
    e.preventDefault()
    if (!newBoardTitle.trim()) return

    setCreating(true)
    try {
      const userEmail = user.signInDetails?.loginId || user.username
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newBoardTitle,
          userId: user.userId,
          userEmail
        })
      })

      if (res.ok) {
        const board = await res.json()
        toast.success('Board created!')
        setShowCreateModal(false)
        setNewBoardTitle('')
        setBoards([board, ...boards])
        router.push(`/board/${board.id}`)
      } else {
        toast.error('Failed to create board')
      }
    } catch (error) {
      toast.error('Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (boardId) => {
    if (!confirm('Delete this board?')) return

    try {
      const res = await fetch(`/api/boards?boardId=${boardId}&userId=${user.userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Board deleted')
        setBoards(boards.filter(b => b.id !== boardId))
      } else {
        toast.error('Failed to delete board')
      }
    } catch (error) {
      toast.error('Failed to delete board')
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600">Whiteboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">My Boards</h2>
              <p className="text-gray-600 mt-1">{boards.length} {boards.length === 1 ? 'board' : 'boards'} total</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <span className="text-xl">+</span> Create New Board
            </button>
          </div>
          
          {user && (
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-lg">{user.username?.[0]?.toUpperCase() || '👤'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-sm text-gray-500">{user.signInDetails?.loginId || user.username}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg shadow-sm">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg mb-2">No boards yet</p>
            <p className="text-gray-400 text-sm mb-6">Create your first board to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold inline-flex items-center gap-2"
            >
              <span className="text-xl">+</span> Create Board
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {boards.map((board) => {
              const isOwner = user && board.ownerId === user.userId
              const collaboratorCount = board.collaborators?.length || 0
              return (
                <div key={board.id} className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all border border-gray-200 overflow-hidden group">
                  <Link href={`/board/${board.id}`}>
                    <div className="cursor-pointer">
                      <div className="h-32 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 relative overflow-hidden">
                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                        <div className="absolute top-2 right-2">
                          {isOwner ? (
                            <span className="px-2 py-1 bg-indigo-600 text-white text-xs rounded-full font-medium">Owner</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-medium">Shared</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{board.title}</h3>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>📅 {new Date(board.updatedAt).toLocaleDateString()}</span>
                          {collaboratorCount > 0 && (
                            <span className="flex items-center gap-1">
                              👥 {collaboratorCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                  {isOwner && (
                    <div className="px-4 pb-3 pt-2 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => deleteBoard(board.id)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4">Create New Board</h3>
            <form onSubmit={createBoard}>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="Board title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
