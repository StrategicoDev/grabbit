import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { joinViaInvite } from '../lib/api'
import toast from 'react-hot-toast'

export default function JoinPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'joining' | 'success' | 'error'>('joining')

  useEffect(() => {
    if (!code) {
      navigate('/')
      return
    }
    joinViaInvite(code).then(listId => {
      if (listId) {
        toast.success("You've joined the list!")
        navigate(`/?list=${listId}`)
      } else {
        setStatus('error')
      }
    })
  }, [code, navigate])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">😕</div>
        <h2 className="text-xl font-bold text-gray-800">Invite not found</h2>
        <p className="text-gray-500 mt-2 text-sm">This link may have expired or already been used.</p>
        <button onClick={() => navigate('/')} className="mt-6 bg-brand-500 text-white px-6 py-3 rounded-xl font-semibold">
          Go Home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <div className="text-5xl mb-4">🛒</div>
      <h2 className="text-xl font-bold text-gray-800">Joining list...</h2>
      <div className="mt-4 w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  )
}
