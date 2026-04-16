'use client'
import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { useUIStore } from '@/lib/store/ui'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalTab, setAuthModalTab } = useUIStore()
  const isLogin = authModalTab === 'signin'
  const router = useRouter()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const supabase = createClient()
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
      }
      closeAuthModal()
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const handleOAuth = async (provider: 'google' | 'spotify') => {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`)
      setLoading(false)
    }
  }

  return (
    <Modal 
      isOpen={isAuthModalOpen} 
      onClose={closeAuthModal} 
      title={isLogin ? "Sign In" : "Create Account"}
    >
      <div className="space-y-4">
        {/* Social Logins */}
        <div className="grid grid-cols-1 gap-3">
          <Button 
            variant="outline" 
            className="w-full bg-white text-black hover:bg-gray-100 border-none flex items-center justify-center gap-3 h-11"
            onClick={() => handleOAuth('google')}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="font-semibold">Continue with Google</span>
          </Button>

          <Button 
            variant="outline" 
            className="w-full bg-[#1DB954] text-black hover:bg-[#1ed760] border-none flex items-center justify-center gap-3 h-11"
            onClick={() => handleOAuth('spotify')}
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.496 17.303c-.215.354-.675.464-1.03.249-2.865-1.75-6.47-2.144-10.713-1.176-.403.092-.809-.163-.901-.566-.092-.403.163-.809.566-.901 4.636-1.06 8.625-.615 11.828 1.34.355.216.465.676.25 1.03zm1.464-3.264c-.27.44-.847.578-1.287.308-3.283-2.017-8.288-2.603-12.163-1.426-.498.151-1.022-.132-1.173-.63-.151-.498.132-1.022.63-1.173 4.425-1.343 9.943-.69 13.687 1.603.44.27.578.847.308 1.287zm.126-3.41c-3.937-2.338-10.434-2.553-14.215-1.405-.604.183-1.246-.171-1.429-.775-.183-.604.171-1.246.775-1.429 4.337-1.317 11.512-1.067 16.03 1.614.543.322.72.1.398 1.263-.322.543-1.023.72-1.56.398z"/>
            </svg>
            <span className="font-semibold text-white">Continue with Spotify</span>
          </Button>
        </div>

        <div className="relative flex items-center justify-center py-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-glass-border"></div>
          </div>
          <span className="relative px-3 bg-bg-surface text-text-muted text-xs font-medium uppercase tracking-widest">
            or
          </span>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Email</label>
          <Input 
            type="email" 
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-secondary">Password</label>
          <Input 
            type="password" 
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <Button className="w-full mt-4" type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isLogin ? "Log In" : "Sign Up")}
        </Button>
        <p className="text-sm text-center text-text-muted mt-4">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button 
            type="button" 
            onClick={() => setAuthModalTab(isLogin ? 'signup' : 'signin')}
            className="text-accent-primary hover:underline font-medium"
            disabled={loading}
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  </Modal>
  )
}
