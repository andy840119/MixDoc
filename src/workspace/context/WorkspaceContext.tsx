import React, { createContext, useState, useContext } from 'react';
import { useDirectoryStore } from '../store/directoryStore';
import { useWorkingFilesStore } from '../store/workingFilesStore';

const WorkspaceContext = createContext({
  directoryStore: null,
  workingFileStore: null,
});

export const WorkspaceProvider = ({ children }) => {
  const directoryStore = useDirectoryStore();
  const workingFileStore = useWorkingFilesStore();

  return (
    <WorkspaceContext.Provider
      value={{ directoryStore: directoryStore, workingFileStore: workingFileStore }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
