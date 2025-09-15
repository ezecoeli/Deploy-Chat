import React, { useState, useEffect } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { LiaWindowClose, LiaPenSolid } from "react-icons/lia";

const NOTES_KEY = "user_notes";

export default function NotesModal({ open, onClose, theme, currentTheme }) {
  const { t } = useTranslation();
  const colors = theme?.colors || {};

  // Load note from localStorage on modal open
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(NOTES_KEY) || "";
      setNote(saved);
    }
  }, [open]);

  // save note to localStorage on change
  useEffect(() => {
    if (open) {
      localStorage.setItem(NOTES_KEY, note);
    }
  }, [note, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative"
        style={{
          background: colors.message || '#fff',
          color: colors.text || '#222',
          border: `1px solid ${colors.border || '#374151'}`,
          fontFamily: theme.font,
        }}
      >
        <button
            className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl"
            onClick={onClose}
            title={t("close")}
        >
            <LiaWindowClose className="w-7 h-7" />
        </button>
        <h2
          className="text-lg font-bold mb-4"
          style={{ color: '#ffffff' }}
        >
          {t("notes")}
        </h2>
        <div className="relative">
            <textarea
                className="w-full h-40 p-2 border rounded resize-none focus:outline-none pr-10"
                style={{
                background: colors.inputBg || '#f3f4f6',
                color: colors.inputText || colors.text || '#222',
                borderColor: colors.border || '#374151',
                fontFamily: theme.font,
                }}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder={t("writeNotes")}
            />
            <LiaPenSolid className="absolute top-3 right-3 text-gray-400 pointer-events-none" />
        </div>
        
      </div>
    </div>
  );
}