import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { AVATAR_OPTIONS, getAvatarById } from '../config/avatars';
import { FiUser, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    selectedAvatar: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

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
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'El nombre no puede exceder 30 caracteres';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username.trim())) {
      newErrors.username = 'Solo se permiten letras, números, espacios y guiones bajos';
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
        setErrors({ username: 'Este nombre de usuario ya está en uso' });
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

      setMessage('Perfil actualizado exitosamente');
      
      // Callback to update UI
      if (onProfileUpdated) {
        onProfileUpdated(data[0]);
      }

      // Close modal after delay
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);

    } catch (error) {
      setMessage('Error al actualizar el perfil');
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
            className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <FiUser className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">
                  {t('editProfile')}
                </h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  {t('profile')}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, username: e.target.value }));
                    setErrors(prev => ({ ...prev, username: '' }));
                  }}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 bg-slate-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                    errors.username 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-slate-600 focus:ring-blue-500'
                  }`}
                  placeholder={t('profile')}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username}</p>
                )}
              </div>

              {/* Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-3">
                  {t('chooseAvatar') || 'Elige tu avatar'}
                </label>
                
                {/* Avatar Grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleAvatarSelect(avatar.id)}
                      disabled={isLoading}
                      className={`aspect-square rounded-lg border-2 transition-all p-1 hover:scale-105 disabled:opacity-50 ${
                        formData.selectedAvatar === avatar.id
                          ? 'border-blue-500 bg-blue-500/20 scale-105'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
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
              <div className="bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-300 mb-3">
                  {t('preview') || 'Vista previa'}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
                    {getPreviewAvatar()}
                    <FiUser className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {formData.username || t('profile')}
                    </p>
                    <p className="text-sm text-gray-400">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`p-3 rounded-lg text-center text-sm ${
                  message.includes('Error') || message.includes('error')
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {message}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {t('cancel') || 'Cancelar'}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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