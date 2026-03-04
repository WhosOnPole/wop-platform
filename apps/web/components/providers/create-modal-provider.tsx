'use client'

import { createContext, useContext, useState, useCallback, useMemo } from 'react'

export type CreateModalType = 'story' | 'poll' | 'tip' | 'post' | null

export interface PostModalRef {
  referencePollId: string
  referencePollQuestion: string
}

interface CreateModalContextValue {
  activeModal: CreateModalType
  setActiveModal: (modal: CreateModalType) => void
  postModalRef: PostModalRef | null
  setPostModalRef: (ref: PostModalRef | null) => void
  openPostModal: (options?: { referencePollId?: string; referencePollQuestion?: string }) => void
  closeModal: () => void
}

const CreateModalContext = createContext<CreateModalContextValue | null>(null)

export function CreateModalProvider({ children }: { children: React.ReactNode }) {
  const [activeModal, setActiveModal] = useState<CreateModalType>(null)
  const [postModalRef, setPostModalRef] = useState<PostModalRef | null>(null)

  const openPostModal = useCallback(
    (options?: { referencePollId?: string; referencePollQuestion?: string }) => {
      setActiveModal('post')
      if (options?.referencePollId && options?.referencePollQuestion) {
        setPostModalRef({
          referencePollId: options.referencePollId,
          referencePollQuestion: options.referencePollQuestion,
        })
      } else {
        setPostModalRef(null)
      }
    },
    []
  )

  const closeModal = useCallback(() => {
    setActiveModal(null)
    setPostModalRef(null)
  }, [])

  const value = useMemo(
    () => ({
      activeModal,
      setActiveModal,
      postModalRef,
      setPostModalRef,
      openPostModal,
      closeModal,
    }),
    [activeModal, postModalRef, openPostModal, closeModal]
  )

  return (
    <CreateModalContext.Provider value={value}>
      {children}
    </CreateModalContext.Provider>
  )
}

export function useCreateModal() {
  const ctx = useContext(CreateModalContext)
  return ctx
}
