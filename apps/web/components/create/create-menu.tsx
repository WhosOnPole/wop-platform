'use client'

import Image from 'next/image'

interface CreateMenuProps {
  onClose: () => void
  onSelect: (key: 'story' | 'poll' | 'tip' | 'post') => void
}

const menuItems = [
  { key: 'story', label: 'submit a story', icon: '/images/flame.svg' },
  { key: 'poll', label: 'create a poll', icon: '/images/poll.svg' },
  { key: 'tip', label: 'track tip', icon: '/images/bulb.svg' },
  { key: 'post', label: 'post', icon: '/images/chat.svg' },
]

export function CreateMenu({ onClose, onSelect }: CreateMenuProps) {
  return (
    <div className="absolute bottom-full left-1/2 z-50 w-48 px-4 py-4 -translate-x-1/2 mb-0 rounded-3xl bg-[#1D1D1D] animate-slide-up overflow-hidden">
      <div className="divide-y divide-[#6B6B6B]">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key as CreateMenuProps['onSelect'] extends (k: infer T) => void ? T : never)
              onClose()
            }}
            className="flex items-center gap-4 pl-2  w-full py-2 text-left text-sm font-normal text-white hover:bg-gray-50 transition-colors"
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
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
