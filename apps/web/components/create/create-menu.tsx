'use client'

import Image from 'next/image'

type CreateMenuKey = 'story' | 'poll' | 'tip' | 'post'

interface CreateMenuProps {
  onClose: () => void
  onSelect: (key: CreateMenuKey) => void
  variant?: 'dropdown' | 'sheet'
}

const menuItems: Array<{ key: CreateMenuKey; label: string; icon: string }> = [
  { key: 'story', label: 'submit a story', icon: '/images/flame.svg' },
  { key: 'poll', label: 'create a poll', icon: '/images/poll.svg' },
  { key: 'tip', label: 'track tip', icon: '/images/bulb.svg' },
  { key: 'post', label: 'post', icon: '/images/chat.svg' },
]

export function CreateMenu({ onClose, onSelect, variant = 'dropdown' }: CreateMenuProps) {
  if (variant === 'sheet') {
    return (
      <div className="divide-y divide-white/10">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key)
              onClose()
            }}
            className="flex items-center gap-4 w-full px-4 py-4 text-left text-base font-medium text-white hover:bg-white/5 transition-colors"
          >
            <Image
              src={item.icon}
              alt=""
              width={18}
              height={18}
              className="object-contain"
            />
            {item.label}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="absolute top-full left-1/2 z-50 w-48 px-4 py-4 -translate-x-1/2 mt-2 rounded-3xl bg-[#1D1D1D] animate-slide-down overflow-hidden">
      <div className="divide-y divide-[#6B6B6B]">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key)
              onClose()
            }}
            className="flex items-center gap-4 pl-2 w-full py-2 text-left text-sm font-normal text-white hover:bg-white/5 transition-colors"
          >
            <Image
              src={item.icon}
              alt=""
              width={16}
              height={16}
              className="object-contain"
            />
            {item.label}
          </button>
        ))}
      </div>
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
