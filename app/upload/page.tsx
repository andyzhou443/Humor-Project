import Link from "next/link";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthButton from "@/components/AuthButton";
import ImageUploader from "@/components/ImageUploader";

export default async function UploadPage() {
  const cookieStore = await cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { }
      },
    }
  )

  // Get both the user and the active session for the JWT
  const { data: { user } } = await supabase.auth.getUser()
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      {/* Top Navigation Bar */}
      <nav className="flex w-full max-w-2xl items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/" className="hover:text-black dark:hover:text-white transition-colors">Vote</Link>
          <Link href="/upload" className="text-black dark:text-white underline underline-offset-4">Upload</Link>
        </div>
        <AuthButton user={user} />
      </nav>

      <main className="flex w-full max-w-2xl flex-col items-center py-10 px-6">
        <header className="mb-10 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">Upload Image</h1>
          <p className="mt-2 text-zinc-500">Generate new AI captions for the community.</p>
        </header>

        {!user ? (
          <div className="w-full rounded-xl border-2 border-dashed border-zinc-300 p-20 text-center dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Please log in to upload</h2>
            <p className="mt-2 text-zinc-500">Access is restricted to authorized users.</p>
          </div>
        ) : (
          <>
            {/* Render the Image Uploader if we have a valid token */}
            {token ? (
              <ImageUploader token={token} />
            ) : (
              <div className="w-full rounded-md bg-red-100 p-4 text-red-700">
                Error: Unable to retrieve active session token. Please try logging in again.
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}