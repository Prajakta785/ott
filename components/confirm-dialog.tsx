import React from 'react';
import { Modal } from './ui/modal';
import { Button } from './ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-12 h-12 rounded-full bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center text-[#991B1B] mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <p className="text-[#6E6259] text-sm mb-6 font-medium leading-relaxed">{message}</p>
        <div className="flex items-center gap-3 w-full justify-center">
          <Button variant="secondary" onClick={onClose} disabled={loading} className="w-1/2">
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            className="w-1/2"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
