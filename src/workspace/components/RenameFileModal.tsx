import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import * as React from 'react';

interface FileModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  oldFileName: string;
}

export default function RenameFileModal({ open, onClose, onSubmit, oldFileName }: FileModalProps) {
  const [name, setName] = useState(oldFileName);

  useEffect(() => {
    setName(oldFileName);
  }, [oldFileName]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Rename the file</DialogTitle>
      <DialogContent>
        <Typography>Rename the file.</Typography>
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
