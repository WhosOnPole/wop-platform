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
    <div className="absolute bottom-16 left-1/2 z-50 w-64 -translate-x-1/2 rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="divide-y divide-gray-100">
        {menuItems.map((item) => (
          <button
            key={item.key}
            onClick={() => {
              onSelect(item.key as CreateMenuProps['onSelect'] extends (k: infer T) => void ? T : never)
              onClose()
            }}
            className="block w-full px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
