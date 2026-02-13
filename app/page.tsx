import Image from "next/image";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthButton from "@/components/AuthButton";

export default async function Home() {
  const cookieStore = await cookies()
  
  // 1. Initialize SSR Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) { /* handled by middleware or ignored in server components */ }
      },
    }
  )

  // 2. Check for User
  const { data: { user } } = await supabase.auth.getUser()

  // 3. Fetch data (Only if user is logged in)
  let images = null
  let error = null
  
  if (user) {
    const response = await supabase
      .from('images')
      .select('id, url, image_description, celebrity_recognition')
      .limit(10);
    images = response.data
    error = response.error
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      {/* Navigation Bar */}
      <nav className="flex w-full max-w-5xl justify-end p-6">
        <AuthButton user={user} />
      </nav>

      <main className="flex w-full max-w-5xl flex-col items-center py-10 px-6 sm:items-start">
        <header className="mb-12">
          <Image className="dark:invert mb-6" src="/next.svg" alt="Next.js" width={100} height={20} priority />
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">Image Database</h1>
        </header>

        {!user ? (
          /* GATED UI */
          <div className="w-full rounded-xl border-2 border-dashed border-zinc-300 p-20 text-center dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Please log in to view the database</h2>
            <p className="text-zinc-500">Access is restricted to authorized users.</p>
          </div>
        ) : (
          /* PROTECTED CONTENT */
          <>
            {error && <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">Error: {error.message}</div>}
            <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {images?.map((img) => (
                <div key={img.id} className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                   <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
                    <img src={img.url} alt={img.image_description} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold">{img.image_description || "No description"}</h3>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}