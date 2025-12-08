import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  // --- Snackbar State ---
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'info' });
  
  // --- Confirm Modal State ---
  const [confirmModal, setConfirmModal] = useState({ show: false, message: '', onConfirm: null });

  // Helper: Show Snackbar
  const notify = useCallback((message, type = 'info') => {
    // Types: 'info', 'success', 'error'
    setSnackbar({ show: true, message, type });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, show: false }));
    }, 3000);
  }, []);

  // Helper: Trigger Confirmation
  const confirmAction = useCallback((message, onConfirm) => {
    setConfirmModal({ show: true, message, onConfirm });
  }, []);

  // Internal: Close Modal
  const closeConfirm = () => {
    setConfirmModal({ show: false, message: '', onConfirm: null });
  };

  // Internal: Handle "Yes" click
  const handleConfirm = () => {
    if (confirmModal.onConfirm) confirmModal.onConfirm();
    closeConfirm();
  };

  return (
    <NotificationContext.Provider value={{ notify, confirmAction }}>
      {children}
      
      {/* --- Snackbar UI --- */}
      <div className={`snackbar ${snackbar.show ? 'show' : ''} ${snackbar.type}`}>
        {snackbar.type === 'error' && '⚠️ '}
        {snackbar.type === 'success' && '✅ '}
        {snackbar.message}
      </div>

      {/* --- Confirm Modal UI --- */}
      {confirmModal.show && (
        <div className="modal-overlay confirm-overlay" onClick={closeConfirm}>
          <div className="modal-content confirm-box" onClick={e => e.stopPropagation()}>
            <h3 style={{marginTop: 0}}>Wait a second...</h3>
            <p>{confirmModal.message}</p>
            <div className="confirm-actions">
              <button className="outline" onClick={closeConfirm} style={{borderColor: '#ccc', color: '#666'}}>Cancel</button>
              <button className="primary-action" onClick={handleConfirm}>Yes, Continue</button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);