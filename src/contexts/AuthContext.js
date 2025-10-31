'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, signIn, signUp, signOut, fetchAuthSession, confirmSignUp, fetchUserAttributes } from 'aws-amplify/auth'
import { configureAmplify } from '@/lib/cognito'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    configureAmplify()
    checkUser()
  }, [])

  const syncUserToDatabase = async (cognitoUser) => {
    try {
      const attributes = await fetchUserAttributes()
      const email = attributes.email
      const name = attributes.name || ''

      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cognitoUser.userId,
          email,
          name
        })
      })
    } catch (error) {
      console.error('Failed to sync user to database:', error)
    }
  }

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      await syncUserToDatabase(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    const { isSignedIn } = await signIn({ username: email, password })
    if (isSignedIn) {
      await checkUser()
    }
    return isSignedIn
  }

  const register = async (email, password, name) => {
    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    })
    return result
  }

  const confirmSignup = async (email, code) => {
    await confirmSignUp({ username: email, confirmationCode: code })
  }

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  const getToken = async () => {
    try {
      const session = await fetchAuthSession()
      return session.tokens?.idToken?.toString()
    } catch {
      return null
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, confirmSignup, logout, getToken, checkUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
