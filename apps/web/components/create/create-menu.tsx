'use client'

interface CreateMenuProps {
  onClose: () => void
  onSelect: (key: 'story' | 'poll' | 'tip' | 'post') => void
}

const menuItems = [
  { key: 'story', label: 'Submit a story' },
  { key: 'poll', label: 'Create a poll' },
  { key: 'tip', label: 'Submit a tip' },
  { key: 'post', label: 'Create a post' },
]

export function CreateMenu({ onClose, onSelect }: CreateMenuProps) {
  return (
    <div className="absolute bottom-full left-1/2 z-50 w-64 -translate-x-1/2 mb-2 rounded-xl border border-gray-200 bg-white shadow-xl animate-slide-up">
      <div className="divide-y divide-gray-100">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key as CreateMenuProps['onSelect'] extends (k: infer T) => void ? T : never)
              onClose()
            }}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
          >
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
