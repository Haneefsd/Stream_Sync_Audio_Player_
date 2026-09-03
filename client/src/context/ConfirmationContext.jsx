import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
  return useContext(ConfirmationContext);
};

export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    actionType: 'primary',
    onConfirm: null,
    onCancel: null,
  });

  const requestConfirmation = useCallback((options) => {
    setModalState({
      ...options,
      isOpen: true,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (modalState.onConfirm) {
      modalState.onConfirm();
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState]);

  const handleCancel = useCallback(() => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    setModalState(prev => ({ ...prev, isOpen: false }));
  }, [modalState]);

  return (
    <ConfirmationContext.Provider value={{ requestConfirmation }}>
      {children}
      {modalState.isOpen && (
        <ConfirmationModal
          title={modalState.title}
          message={modalState.message}
          confirmText={modalState.confirmText || 'Confirm'}
          cancelText={modalState.cancelText || 'Cancel'}
          actionType={modalState.actionType || 'primary'}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmationContext.Provider>
  );
};
