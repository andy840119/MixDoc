import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  message: string;
  confirmButtonText: string;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  message,
  confirmButtonText,
}: ConfirmModalProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>
        <WarningIcon color='error' /> Confirm
      </DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant='contained' color='error'>
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
