'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Camera, Mail, ShieldCheck, ChevronRight, LogOut } from 'lucide-react'
import { useLibraryStore } from '@/lib/store/library'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { user, updateProfile, setUser } = useLibraryStore()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '')

  const handleSave = async () => {
    updateProfile({ name, avatar_url: avatarUrl })
    setIsEditing(false)
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/discovery'
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <User className="w-10 h-10 text-white/20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">No user found</h1>
        <p className="text-[#b3b3b3] max-w-xs mx-auto mb-8">Please sign in to view and manage your profile settings.</p>
        <button 
          onClick={() => (window as any).location.href = '/discovery'}
          className="px-8 py-3 bg-white text-black font-black rounded-full hover:scale-105 transition-transform"
        >
          Go Back Home
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-black text-white mb-2">Profile Settings</h1>
        <p className="text-[#b3b3b3]">Manage your account details and preferences.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Avatar & Stats */}
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] flex flex-col items-center text-center backdrop-blur-sm"
          >
            <div className="relative group mb-6">
              <div className="w-32 h-32 rounded-full bg-accent-primary/20 overflow-hidden ring-4 ring-white/5 flex items-center justify-center">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-accent-primary" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <h2 className="text-2xl font-black text-white px-2 truncate w-full">{user.name}</h2>
            <p className="text-accent-primary font-bold text-xs uppercase tracking-widest mt-1 mb-6 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              Verified Account
            </p>

            <div className="grid grid-cols-2 w-full gap-2 opacity-80">
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-xl font-bold text-white">12</p>
                <p className="text-[10px] text-[#b3b3b3] uppercase tracking-wider">Playlists</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl">
                <p className="text-xl font-bold text-white">248</p>
                <p className="text-[10px] text-[#b3b3b3] uppercase tracking-wider">Liked</p>
              </div>
            </div>
          </motion.div>

          <button 
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 p-4 rounded-2xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors font-bold border border-rose-500/20"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* Right: Forms */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Full Name</h3>
              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-1.5 rounded-full bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-1.5 rounded-full text-sm font-semibold hover:text-white transition-colors text-[#b3b3b3]"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-4 py-1.5 rounded-full bg-accent-primary text-black text-sm font-bold hover:scale-105 transition-transform"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider ml-1">Display Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b3b3b3] group-focus-within:text-white transition-colors" />
                  <input 
                    type="text"
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-accent-primary focus:bg-white/[0.08] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider ml-1">Email Address</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b3b3b3]" />
                  <input 
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white cursor-not-allowed"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-white/10 text-[10px] uppercase font-black text-white/50 tracking-tighter">
                    Primary
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider ml-1">Profile Photo URL</label>
                <input 
                  type="text"
                  disabled={!isEditing}
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:border-accent-primary focus:bg-white/[0.08] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>
            </div>
          </motion.div>

          {/* Connected Services */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
          >
            <h3 className="text-xl font-bold text-white mb-6">Connected Accounts</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Google Account</p>
                    <p className="text-xs text-[#b3b3b3]">Connected via OAuth</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#b3b3b3] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#1DB954] flex items-center justify-center">
                    <img src="https://open.spotifycdn.com/cdn/images/favicon32.b64ecc03.png" className="w-5 h-5 invert" alt="Spotify" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Spotify Account</p>
                    <p className="text-xs text-[#b3b3b3]">Connected via OAuth</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#b3b3b3] group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
