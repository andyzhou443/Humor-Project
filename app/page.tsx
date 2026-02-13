import Image from "next/image";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthButton from "@/components/AuthButton";
import VotingInterface from "@/components/VotingInterface";

// 1. Define the shape of your data
type Caption = {
  id: string
  content: string | null
  image_id: string
  images: {
    url: string
  } | null // This handles if the join returns a null image
}

export default async function Home() {
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

  const { data: { user } } = await supabase.auth.getUser()

  // 2. Initialize with the explicit type
  let captions: Caption[] = []
  let error = null
  
  if (user) {
    const response = await supabase
      .from('captions')
      .select(`
        id,
        content,
        image_id,
        images (
          url
        )
      `)
      .limit(20);
      
    // 3. Cast the response data to match your type
    if (response.data) {
      captions = response.data as unknown as Caption[]
    }
    error = response.error
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <nav className="flex w-full max-w-2xl justify-end p-6">
        <AuthButton user={user} />
      </nav>

      <main className="flex w-full max-w-2xl flex-col items-center py-6 px-6">
        <header className="mb-10 flex flex-col items-center text-center">
          <Image className="dark:invert mb-4" src="/next.svg" alt="Next.js" width={100} height={20} priority />
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">Rate the Caption</h1>
          <p className="mt-2 text-zinc-500">Vote on the best matches.</p>
        </header>

        {!user ? (
          <div className="w-full rounded-xl border-2 border-dashed border-zinc-300 p-20 text-center dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Please log in to start voting</h2>
            <p className="text-zinc-500 mt-2">Access is restricted to authorized users.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6 w-full">
                Error: {error.message}
              </div>
            )}
            
            {/* The types should now match perfectly */}
            <VotingInterface initialCaptions={captions} userId={user.id} />
          </>
        )}
      </main>
    </div>
  );
}