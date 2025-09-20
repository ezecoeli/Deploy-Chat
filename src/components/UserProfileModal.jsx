import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { useTerminalTheme } from '../hooks/useTerminalTheme';
import { AVATAR_OPTIONS, getAvatarById } from '../config/avatars';
import { FiUser, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { t } = useTranslation();
  const { currentTheme, allThemes } = useTerminalTheme();
  const [formData, setFormData] = useState({
    username: '',
    selectedAvatar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  // fallback and validation for themes
  const theme = allThemes[currentTheme] || allThemes.default || {
    colors: {
      background: '#1e293b',
      border: '#475569',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#3b82f6'
    }
  };

  // Load user data when modal opens
  useEffect(() => {
    if (isOpen && user) {
      loadUserProfile();
    }
  }, [isOpen, user]);

  const loadUserProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Detect if it's a preloaded avatar
      const preloadedAvatar = AVATAR_OPTIONS.find(av => 
        data.avatar_url === av.id
      );

      setFormData({
        username: data.username || user.email.split('@')[0],
        selectedAvatar: preloadedAvatar ? data.avatar_url : '',
      });
    } catch (error) {
      // Fallback to default values
      setFormData({
        username: user.email.split('@')[0],
        selectedAvatar: 'avatar-01', // Default avatar
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate username
    if (!formData.username.trim()) {
      newErrors.username = t('usernameRequired') || 'Username is required';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = t('usernameMinLength') || 'Username must be at least 2 characters';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = t('usernameMaxLength') || 'Username cannot exceed 30 characters';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username.trim())) {
      newErrors.username = t('usernameInvalidChars') || 'Only letters, numbers, spaces and underscores allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setMessage('');

    try {
      // Check if username already exists (different from current user)
      const { data: existingUsers, error: checkError } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', formData.username.trim())
        .neq('id', user.id);

      // Handle error 406 specifically
      if (checkError && checkError.code !== 'PGRST116') { 
        // Continue without verification if there's permission error
      } else if (existingUsers && existingUsers.length > 0) {
        setErrors({ username: t('usernameAlreadyExists') || 'This username is already taken' });
        setIsLoading(false);
        return;
      }

      // Determine final avatar URL
      const finalAvatarUrl = formData.selectedAvatar;

      // Update profile
      const { data, error } = await supabase
        .from('users')
        .update({
          username: formData.username.trim(),
          avatar_url: finalAvatarUrl
        })
        .eq('id', user.id)
        .select();

      if (error) throw error;

      setMessage(t('profileUpdated'));

      // Callback to update UI
      if (onProfileUpdated) {
        onProfileUpdated(data[0]);
      }

      /* Close modal after delay
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);*/

    } catch (error) {
      setMessage(t('profileUpdateError') || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData(prev => ({
      ...prev,
      selectedAvatar: avatarId,
    }));
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  
  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setMessage('');
      setErrors({});
    }
  };

  const getPreviewAvatar = () => {
    if (formData.selectedAvatar) {
      const avatar = getAvatarById(formData.selectedAvatar);
      return avatar ? (
        <img 
          src={avatar.src} 
          alt={avatar.name}
          className="w-full h-full object-cover"
        />
      ) : null;
    }
    return null;
  };
    
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            style={{ 
              backgroundColor: theme.colors.background,
              border: `1px solid ${theme.colors.border}`
            }}
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-6 border-b"
              style={{ borderColor: theme.colors.border }}
            >
              <div className="flex items-center gap-3">
                <FiUser className="w-6 h-6" style={{ color: theme.colors.accent }} />
                <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>
                  {t('editProfile')}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="hover:opacity-75 transition-opacity disabled:opacity-50"
                style={{ color: theme.colors.textSecondary }}
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: theme.colors.text }}>
                  {t('profile')}:
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }));
                    setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    errors.username 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'focus:ring-2'
                  }`}
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: errors.username ? '#ef4444' : theme.colors.border,
                    color: currentTheme === 'coolRetro' ? '#ffcc00' : '#000000', // Negro en todos excepto coolRetro
                    focusRingColor: theme.colors.accent
                  }}
                  placeholder={t('profile')}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: theme.colors.text }}>
                  {t('chooseAvatar') || 'Elige tu avatar'}:
                </label>
                
                {/* Avatar Grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar.id)}
                      disabled={isLoading}
                      className={`aspect-square rounded-lg border-2 transition-all p-1 hover:scale-105 disabled:opacity-50`}
                      style={{
                        borderColor: formData.selectedAvatar === avatar.id 
                          ? theme.colors.accent 
                          : theme.colors.border,
                        backgroundColor: formData.selectedAvatar === avatar.id 
                          ? `${theme.colors.accent}20` 
                          : 'transparent'
                      }}
                      title={avatar.name}
                    >
                      <img 
                        src={avatar.src} 
                        alt={avatar.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    </button>
                  ))}
                </div>

                {errors.avatar && (
                  <p className="mt-1 text-sm text-red-400">{errors.avatar}</p>
                )}
              </div>

              {/* Preview */}
              <div 
                className="rounded-lg p-4"
                style={{ backgroundColor: `${theme.colors.border}50` }}
              >
                <p className="text-sm mb-3" style={{ color: theme.colors.textSecondary }}>
                  {t('preview') || 'Vista previa'}:
                </p>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: theme.colors.border }}
                  >
                    {getPreviewAvatar()}
                    <FiUser className="w-6 h-6" style={{ color: theme.colors.textSecondary }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: theme.colors.text }}>
                      {formData.username || t('profile')}
                    </p>
                    {/*<p className="text-sm" style={{ color: theme.colors.textSecondary }}>
                      {user?.email}
                    </p>*/}
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-2 rounded-lg text-center text-sm ${
                  message.includes('Error') || message.includes('error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'border'
                }`}
                style={{
                  backgroundColor: message.includes('Error') ? undefined : `${theme.colors.accent}20`,
                  color: message.includes('Error') ? undefined : theme.colors.accent,
                  borderColor: message.includes('Error') ? undefined : theme.colors.accent
                }}>
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-2 py-2 rounded-lg transition-colors disabled:opacity-50"
                  style={{
                    backgroundColor: theme.colors.border,
                    color: currentTheme === 'coolRetro' ? '#ffffff' : theme.colors.text
                  }}
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-2 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: theme.colors.accent,
                    color: theme.colors.background
                  }}
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="w-4 h-4 animate-spin" />
                      {t('saving') || 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <FiCheck className="w-4 h-4" />
                      {t('saveChanges') || 'Guardar Cambios'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}