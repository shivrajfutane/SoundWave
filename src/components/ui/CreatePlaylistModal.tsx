'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useUIStore } from '@/lib/store/ui'
import { useLibraryStore } from '@/lib/store/library'
import { animateRipple } from '@/lib/microinteractions'

export function CreatePlaylistModal() {
  const { isPlaylistModalOpen, setPlaylistModalOpen } = useUIStore()
  const { createPlaylist } = useLibraryStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createPlaylist(name.trim(), description.trim())
    
    // Reset and close
    setName('')
    setDescription('')
    setPlaylistModalOpen(false)
  }

  const handleInteraction = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    animateRipple(e.currentTarget, e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <Modal 
      isOpen={isPlaylistModalOpen} 
      onClose={() => setPlaylistModalOpen(false)}
      title="Create Playlist"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="playlistName" className="text-sm font-medium text-text-primary">
            Name
          </label>
          <input
            id="playlistName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Awesome Playlist"
            className="bg-bg-surface-hover border border-glass-border-hover rounded px-3 py-2 text-white placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors duration-200"
            autoFocus
            required
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label htmlFor="playlistDesc" className="text-sm font-medium text-text-primary">
            Description <span className="text-text-muted font-normal">(optional)</span>
          </label>
          <textarea
            id="playlistDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add an optional description"
            className="bg-bg-surface-hover border border-glass-border-hover rounded px-3 py-2 text-white placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors duration-200 resize-none h-24"
          />
        </div>

        <button 
          onMouseDown={handleInteraction}
          type="submit"
          disabled={!name.trim()}
          className="mt-2 w-full py-2.5 bg-accent-primary text-black font-semibold rounded hover:bg-accent-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative overflow-hidden"
        >
          Create
        </button>
      </form>
    </Modal>
  )
}
