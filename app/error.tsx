'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>حدث خطأ ما</h2>
      <button onClick={() => reset()}>حاول مرة أخرى</button>
    </div>
  )
} 