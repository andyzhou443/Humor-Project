'use client'

import { useState } from 'react'

// Added userId to the props definition
export default function ImageUploader({ token, userId }: { token: string; userId: string }) {
  const [status, setStatus] = useState<string>('')
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setGeneratedCaptions([])

    try {
      // STEP 1: Generate Presigned URL
      setStatus('Step 1: Generating presigned URL...')
      const res1 = await fetch('https://api.almostcrackd.ai/pipeline/generate-presigned-url', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ contentType: file.type })
      })
      if (!res1.ok) throw new Error('Failed to generate presigned URL')
      const { presignedUrl, cdnUrl } = await res1.json()

      // STEP 2: Upload Image Bytes
      setStatus('Step 2: Uploading image to storage...')
      const res2 = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      })
      if (!res2.ok) throw new Error('Failed to upload image bytes')

      // STEP 3: Register Image URL in the Pipeline
      setStatus('Step 3: Registering image...')
      const res3 = await fetch('https://api.almostcrackd.ai/pipeline/upload-image-from-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageUrl: cdnUrl,
          isCommonUse: false,
          // NEW FIELDS:
          created_by_user_id: userId,
          modified_by_user_id: userId
        })
      })
      if (!res3.ok) throw new Error('Failed to register image')
      const { imageId } = await res3.json()

      // STEP 4: Generate Captions
      setStatus('Step 4: Generating captions...')
      const res4 = await fetch('https://api.almostcrackd.ai/pipeline/generate-captions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          imageId,
          // NEW FIELDS (assuming your caption table also requires these):
          created_by_user_id: userId,
          modified_by_user_id: userId
        })
      })
      if (!res4.ok) throw new Error('Failed to generate captions')
      const captions = await res4.json()

      setGeneratedCaptions(captions)
      setStatus('Complete!')

    } catch (error: any) {
      console.error(error)
      setStatus(`Error: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mb-8 w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold">Upload an Image for Captions</h2>
      
      <input 
        type="file" 
        accept="image/jpeg, image/jpg, image/png, image/webp, image/gif, image/heic" 
        onChange={handleUpload}
        disabled={isUploading}
        className="mb-4 block w-full text-sm text-zinc-500 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-zinc-200 dark:file:bg-zinc-800 dark:hover:file:bg-zinc-700"
      />
      
      {status && (
        <p className={`text-sm ${status.startsWith('Error') ? 'text-red-500' : 'text-zinc-500'}`}>
          {status}
        </p>
      )}

      {generatedCaptions.length > 0 && (
        <div className="mt-6 rounded-md bg-zinc-50 p-4 dark:bg-black">
          <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">Generated Captions:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {generatedCaptions.map((caption: any, index: number) => (
              <li key={index}>{caption.content || JSON.stringify(caption)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}