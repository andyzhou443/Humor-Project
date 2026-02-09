import Image from "next/image";
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default async function Home() {
  // 1. Fetch data from your 'images' table
  // We'll grab the URL, description, and celebrity info
  const { data: images, error } = await supabase
    .from('images')
    .select('id, url, image_description, celebrity_recognition')
    .limit(10); // Limits to 10 items for now

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-5xl flex-col items-center py-20 px-6 sm:items-start">
        
        <header className="mb-12">
          <Image
            className="dark:invert mb-6"
            src="/next.svg"
            alt="Next.js logo"
            width={100}
            height={20}
            priority
          />
          <h1 className="text-4xl font-bold tracking-tight text-black dark:text-zinc-50">
            Image Database
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Fetching data directly from your Supabase `images` table.
          </p>
        </header>

        {/* 2. Display an error message if the fetch fails */}
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">
            Error: {error.message}. Make sure RLS is configured!
          </div>
        )}

        {/* 3. The Data Grid */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {images?.map((img) => (
            <div 
              key={img.id} 
              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800">
                {img.url ? (
                  <img
                    src={img.url}
                    alt={img.image_description || "Database image"}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-zinc-400">
                    No Image URL
                  </div>
                )}
              </div>

              {/* Data Labels */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {img.image_description || "No description"}
                </h3>
                {img.celebrity_recognition && (
                  <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                    👤 {img.celebrity_recognition}
                  </p>
                )}
              </div>
            </div>
          ))}

          {/* Fallback if table is empty */}
          {images?.length === 0 && (
            <p className="text-zinc-500">No images found in the database.</p>
          )}
        </div>
      </main>
    </div>
  );
}