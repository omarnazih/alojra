'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button, type ButtonProps } from '@/components/ui/button'

export interface ConfirmDialogAction {
  label: string
  variant?: ButtonProps['variant']
  onClick: () => void
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: React.ReactNode
  actions: ConfirmDialogAction[]
  onCancel: () => void
}

/**
 * A small, flexible confirmation dialog. Escape or clicking the backdrop
 * triggers the cancel handler, matching standard dialog behaviour.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  actions,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row-reverse">
          {actions.map((action) => (
            <Button
              key={action.label}
              type="button"
              variant={action.variant ?? 'default'}
              onClick={action.onClick}
              className="w-full sm:w-auto"
            >
              {action.label}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
