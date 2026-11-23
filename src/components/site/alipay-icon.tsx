/** 支付宝标识（简化图形） */
export function AlipayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="currentColor" opacity="0" />
      <path
        fill="currentColor"
        d="M5.6 2h12.8A3.6 3.6 0 0 1 22 5.6v8.3c-1.6-.6-4.4-1.6-6.6-2.4.6-1 1.1-2.3 1.4-3.6h-3.4V6.6h4.2v-.8h-4.2V3.7h-1.8v2.1H7.4v.8h4.2v1.3H8.1v.7h7.1c-.2.8-.5 1.6-.9 2.3-1.6-.5-3.2-.9-4.5-.9-2.7 0-4 1.3-4 2.8 0 1.6 1.5 2.8 3.7 2.8 1.8 0 3.5-.8 4.8-2.2 1.9.9 5.3 2.6 7.7 3.8v.9a3.6 3.6 0 0 1-3.6 3.6H5.6A3.6 3.6 0 0 1 2 18.4V5.6A3.6 3.6 0 0 1 5.6 2Zm3.6 9.6c1 0 2.2.4 3.6 1.1-1 1.2-2.3 1.9-3.6 1.9-1.4 0-2-.6-2-1.4 0-.9.8-1.6 2-1.6Z"
      />
    </svg>
  );
}
