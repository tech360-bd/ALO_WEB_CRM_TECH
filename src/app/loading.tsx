export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7FAFE]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0066CC] to-[#0284C7] text-white shadow-lg">
          <span className="text-2xl font-black">A</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="size-5 animate-spin rounded-full border-2 border-[#0066CC] border-t-transparent" />
          <span className="text-sm font-medium text-[#5A7299]">Loading ALO Education...</span>
        </div>
      </div>
    </div>
  );
}
