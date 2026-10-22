// Brand logos for the sidebar's social links (Octicons has no brand icons). Sized and coloured like an Octicon.

interface BrandIconProps {
  size?: number;
  className?: string;
}

export function LinkedInIcon({ size = 16, className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M116 3H12a8.91 8.91 0 0 0-9 8.8v104.42a8.91 8.91 0 0 0 9 8.78h104a8.93 8.93 0 0 0 9-8.81V11.77A8.93 8.93 0 0 0 116 3ZM39.17 107H21.06V48.73h18.11Zm-9-66.21a10.5 10.5 0 1 1 10.49-10.5 10.5 10.5 0 0 1-10.54 10.48ZM107 107H88.89V78.65c0-6.75-.12-15.44-9.41-15.44s-10.87 7.36-10.87 15V107H50.53V48.73h17.36v8h.24c2.42-4.58 8.32-9.41 17.13-9.41C103.6 47.28 107 59.35 107 75Z" />
    </svg>
  );
}

export function XLogoIcon({ size = 16, className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 1200 1227" width={size} height={size} fill="currentColor" aria-hidden="true" className={className}>
      <path d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z" />
    </svg>
  );
}
