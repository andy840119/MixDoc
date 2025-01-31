import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { useState } from 'react';
import Typography from '@mui/material/Typography';
import * as React from 'react';

interface DirectoryModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  defaultValue?: string;
}

export default function CreateDirectoryModal({
  open,
  onClose,
  onSubmit,
  defaultValue = '',
}: DirectoryModalProps) {
  const [name, setName] = useState(defaultValue);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Create</DialogTitle>
      <DialogContent>
        <Typography>Create a new directory with name.</Typography>
        <TextField autoFocus fullWidth value={name} onChange={(e) => setName(e.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSubmit(name)} variant='contained'>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
}
