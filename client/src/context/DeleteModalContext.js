import React, { createContext, useContext, useState } from 'react';

const DeleteModalContext = createContext();

export const useDeleteModal = () => {
  const context = useContext(DeleteModalContext);
  if (!context) {
    throw new Error('useDeleteModal must be used within a DeleteModalProvider');
  }
  return context;
};

export const DeleteModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState({});

  const showDeleteModal = ({
    title = 'Delete Item',
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText = 'Delete',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    itemName = null,
    destructive = true,
  }) => {
    setDeleteConfig({
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
      itemName,
      destructive,
    });
    setIsOpen(true);
  };

  const hideDeleteModal = () => {
    setIsOpen(false);
    setDeleteConfig({});
  };

  const handleConfirm = () => {
    if (deleteConfig.onConfirm) {
      deleteConfig.onConfirm();
    }
    hideDeleteModal();
  };

  const handleCancel = () => {
    if (deleteConfig.onCancel) {
      deleteConfig.onCancel();
    }
    hideDeleteModal();
  };

  return (
    <DeleteModalContext.Provider
      value={{
        isOpen,
        deleteConfig,
        showDeleteModal,
        hideDeleteModal,
        handleConfirm,
        handleCancel,
      }}
    >
      {children}
    </DeleteModalContext.Provider>
  );
};
