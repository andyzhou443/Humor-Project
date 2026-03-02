import Link from "next/link";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import AuthButton from "@/components/AuthButton";
import VotingInterface from "@/components/VotingInterface";

type Caption = {
  id: string
  content: string | null
  image_id: string
  images: {
    url: string
  } | null 
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

  let captions: Caption[] = []
  let error = null
  
  if (user) {
    // 1. Fetch the IDs of captions the user has already voted on
    const { data: pastVotes, error: votesError } = await supabase
      .from('caption_votes')
      .select('caption_id')
      .eq('profile_id', user.id)

    if (votesError) {
      console.error("Error fetching past votes:", votesError)
    }

    // Extract just the IDs into a simple array of strings
    const votedIds = pastVotes?.map(vote => vote.caption_id) || []

    // 2. Build the query to fetch captions
    let query = supabase
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

    // 3. If they have past votes, filter them out using `.not('id', 'in', ...)`
    if (votedIds.length > 0) {
      // Format the array into a comma-separated string wrapped in parentheses for PostgREST
      query = query.not('id', 'in', `(${votedIds.join(',')})`)
    }
      
    const response = await query;
      
    if (response.data) {
      captions = response.data as unknown as Caption[]
    }
    error = response.error
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <nav className="flex w-full max-w-2xl items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link href="/" className="text-black dark:text-white underline underline-offset-4">Vote</Link>
          <Link href="/upload" className="hover:text-black dark:hover:text-white transition-colors">Upload</Link>
        </div>
        <AuthButton user={user} />
      </nav>

      <main className="flex w-full max-w-2xl flex-col items-center py-10 px-6">
        <header className="mb-10 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tight text-black dark:text-zinc-50">Rate the Caption</h1>
          <p className="mt-2 text-zinc-500">Vote on the best matches.</p>
        </header>

        {!user ? (
          <div className="w-full rounded-xl border-2 border-dashed border-zinc-300 p-20 text-center dark:border-zinc-800">
            <h2 className="text-xl font-semibold">Please log in to start voting</h2>
            <p className="mt-2 text-zinc-500">Access is restricted to authorized users.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 w-full rounded-md bg-red-100 p-4 text-red-700">
                Error: {error.message}
              </div>
            )}
            <VotingInterface initialCaptions={captions} userId={user.id} />
          </>
        )}
      </main>
    </div>
  );
}