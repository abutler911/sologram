import React from "react";
import { useDeleteModal } from "../context/DeleteModalContext";
import { COLORS, THEME } from "../theme";

const DeleteConfirmationModal = () => {
  const { isOpen, deleteConfig, handleConfirm, handleCancel } =
    useDeleteModal();

  if (!isOpen) return null;

  const { title, message, confirmText, cancelText, itemName, destructive } =
    deleteConfig;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
        </div>

        <div style={styles.body}>
          <div style={styles.iconContainer}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke={COLORS.error}
              strokeWidth="2"
              style={styles.warningIcon}
            >
              <path d="M3 6h18l-1.5 14.5H4.5L3 6zM8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </div>

          <p style={styles.message}>{message}</p>

          {itemName && (
            <div style={styles.itemHighlight}>
              <strong>"{itemName}"</strong>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button
            onClick={handleCancel}
            style={styles.cancelButton}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor =
                THEME.button.secondary.hoverBackground;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor =
                THEME.button.secondary.background;
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={handleConfirm}
            style={{
              ...styles.confirmButton,
              backgroundColor: destructive
                ? COLORS.error
                : THEME.button.action.background,
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = destructive
                ? "#c9302c"
                : THEME.button.action.hoverBackground;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = destructive
                ? COLORS.error
                : THEME.button.action.background;
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(4px)",
  },
  modal: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: "12px",
    boxShadow: `0 20px 40px ${COLORS.shadow}`,
    maxWidth: "400px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "hidden",
    border: `1px solid ${COLORS.border}`,
  },
  header: {
    padding: "20px 24px 12px",
    borderBottom: `1px solid ${COLORS.divider}`,
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  body: {
    padding: "20px 24px",
    textAlign: "center",
  },
  iconContainer: {
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center",
  },
  warningIcon: {
    opacity: 0.8,
  },
  message: {
    margin: "0 0 16px",
    fontSize: "16px",
    lineHeight: "1.5",
    color: COLORS.textSecondary,
  },
  itemHighlight: {
    padding: "8px 12px",
    backgroundColor: COLORS.elevatedBackground,
    borderRadius: "6px",
    border: `1px solid ${COLORS.border}`,
    fontSize: "14px",
    color: COLORS.textPrimary,
  },
  footer: {
    padding: "16px 24px 24px",
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
  },
  cancelButton: {
    padding: "10px 20px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: "8px",
    backgroundColor: THEME.button.secondary.background,
    color: THEME.button.secondary.text,
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
  confirmButton: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "8px",
    color: "#FFFFFF",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.2s ease",
    outline: "none",
  },
};

export default DeleteConfirmationModal;
