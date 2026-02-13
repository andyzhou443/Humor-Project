'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Heart, X } from 'lucide-react' // Assuming you have lucide-react, or use SVGs
// components/VotingInterface.tsx

// CHANGE THIS:
type CaptionData = {
  id: string
  content: string | null  // <--- Allow null here
  image_id: string
  images: {
    url: string
  } | null
}
// ... rest of the file
interface VotingInterfaceProps {
  initialCaptions: CaptionData[]
  userId: string
}

export default function VotingInterface({ initialCaptions, userId }: VotingInterfaceProps) {
  const [queue, setQueue] = useState<CaptionData[]>(initialCaptions)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Determine current and next items
  const currentItem = queue[currentIndex]
  const nextItem = queue[currentIndex + 1]

const handleVote = async (voteValue: number) => {
    if (!currentItem) return

    // 1. Capture current ID before moving index
    const captionIdToVote = currentItem.id

    // 2. OPTIMISTIC UI: Move to next immediately
    if (currentIndex < queue.length - 1) {
    setCurrentIndex((prev) => prev + 1)
    } else {
    setQueue([]) // Clear or show "No more items" state
    }

    // 3. Prepare the data payload
    const votePayload = {
    profile_id: userId,
    caption_id: captionIdToVote,
    vote_value: voteValue,
    created_datetime_utc: new Date().toISOString(),
    modified_datetime_utc: new Date().toISOString(),
    }

    // --- LOGGING HERE ---
    console.log("🚀 Sending Vote to DB:", votePayload)
    // --------------------

    // 4. Database Update
    try {
    const { error } = await supabase
        .from('caption_votes')
        .upsert(votePayload, { 
            onConflict: 'profile_id, caption_id' 
        })

    if (error) {
        console.error('Error recording vote:', error)
    } else {
        console.log("✅ Vote success!")
    }
    } catch (err) {
    console.error('Unexpected error:', err)
    }
}
  // If we run out of items
  if (!currentItem) {
    return (
      <div className="flex h-96 w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700">
        <p className="text-zinc-500">No more captions to vote on!</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      
      {/* CARD CONTAINER */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        
        {/* IMAGE AREA */}
        <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
          <img 
            src={currentItem.images?.url} 
            alt="Caption target" 
            className="h-full w-full object-cover"
          />
        </div>

        {/* CAPTION AREA */}
        <div className="p-6 text-center">
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            {currentItem.content || "Untitled Caption"}
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex items-center gap-8">
        {/* DISLIKE BUTTON (-1) */}
        <button
          onClick={() => handleVote(-1)}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-zinc-200 transition-all hover:scale-110 hover:bg-red-50 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-red-950/30"
          aria-label="Dislike"
        >
          <X className="h-8 w-8 text-zinc-400 transition-colors group-hover:text-red-500" />
        </button>

        {/* LIKE BUTTON (+1) */}
        <button
          onClick={() => handleVote(1)}
          className="group flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-zinc-200 transition-all hover:scale-110 hover:bg-green-50 dark:bg-zinc-900 dark:ring-zinc-800 dark:hover:bg-green-950/30"
          aria-label="Like"
        >
          <Heart className="h-8 w-8 fill-transparent text-zinc-400 transition-colors group-hover:fill-green-500 group-hover:text-green-500" />
        </button>
      </div>

      {/* HIDDEN PRELOADER FOR NEXT ITEM */}
      {/* This renders the NEXT image in a hidden div so the browser caches it */}
      {nextItem && nextItem.images?.url && (
        <div className="hidden">
           <img src={nextItem.images.url} alt="preload" />
        </div>
      )}
    </div>
  )
}