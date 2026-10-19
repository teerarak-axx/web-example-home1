export function LineIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M27.7 14.1c0-6-5.2-10.8-11.7-10.8S4.3 8.1 4.3 14.1c0 5.4 4.1 9.8 9.7 10.7.4.1.9.3 1 .7.1.3.1.8 0 1.1l-.2 1.1c0 .3-.2 1.2 1 .7 1.3-.5 7-4.1 9.5-7.1 1.6-1.9 2.4-4.4 2.4-7.2Z" />
      <text x="7.1" y="17.1" fontSize="7" fontWeight="800" fontFamily="Arial" fill="white">
        LINE
      </text>
    </svg>
  );
}
export function FacebookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12A10 10 0 1 0 10.44 21.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.19 2.23.19v2.45h-1.26c-1.24 0-1.62.77-1.62 1.56V12h2.77l-.44 2.89h-2.33v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  );
}
export function TreeLogo() {
  return (
    <svg width="40" height="42" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M24 43V20m0 16-9-9m9 3 9-11m-9 7-6-9" stroke="#395c35" strokeWidth="1.2" />
      <path
        d="M14 30C2 26 8 15 13 15 10 5 21 2 24 8 30 1 39 8 36 15 47 17 42 29 34 29c-3 8-10 5-10 5s-7 5-10-4Z"
        stroke="#395c35"
        strokeWidth="1.1"
      />
      <path d="M17 44h14" stroke="#395c35" strokeWidth="1.2" />
    </svg>
  );
}

export function BrandMark({
  src,
  alt,
  className = '',
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  return src ? (
    <img className={'brand-mark ' + className} src={src} alt={alt} width={64} height={64} />
  ) : (
    <span className={'brand-fallback ' + className} aria-label={alt}>
      <TreeLogo />
    </span>
  );
}
