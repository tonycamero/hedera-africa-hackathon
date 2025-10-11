/**
 * Simple Modal wrapper using shadcn Dialog
 */

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-slate-900/95 border border-white/20 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {title}
          </DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}