import Link from 'next/link'

interface LogoProps {
  variant?: 'gradient' | 'white' | 'black' | 'icon' | 'seal' | 'gradient_white'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  href?: string
  className?: string
}

export function Logo({ variant = 'gradient', size = 'md', href = '/', className = '' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto',
    xl: 'h-24 w-auto',
  }

  const getLogoSrc = () => {
    switch (variant) {
      case 'gradient':
        return '/images/logo_gradient.svg'
      case 'white':
        return '/images/logo_white.svg'
      case 'black':
        return '/images/logo_black.svg'
      case 'icon':
        return '/images/icon_gradient.svg'
      case 'seal':
        return '/images/seal_black.svg'
      default:
        return '/images/logo_gradient.svg'
    }
  }

  const logoElement = (
    <img
      src={getLogoSrc()}
      alt="Who's on Pole?"
      className={`${sizeClasses[size]} ${className}`}
    />
  )

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {logoElement}
      </Link>
    )
  }

  return logoElement
}

