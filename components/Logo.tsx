import Link from 'next/link';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  href?: string;
  size?: LogoSize;
  className?: string;
}

const sizeClasses: Record<LogoSize, string> = {
  sm: 'text-[1.05rem] sm:text-[1.15rem]',
  md: 'text-[1.3rem] sm:text-[1.5rem]',
  lg: 'text-[1.6rem] sm:text-[1.9rem]',
};

export function Logo({ href = '/', size = 'md', className = '' }: LogoProps) {
  const classes = [
    'font-display uppercase leading-none tracking-[0.22em] font-semibold text-chayo-text',
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link href={href} className={classes} aria-label="Chayo home">
      CHAYO
    </Link>
  );
}
