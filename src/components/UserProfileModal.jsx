import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useTranslation } from '../hooks/useTranslation';
import { AVATAR_OPTIONS, getAvatarById } from '../config/avatars';
import { FiUser, FiX, FiCheck, FiLoader } from 'react-icons/fi';

export default function UserProfileModal({ isOpen, onClose, user, onProfileUpdated }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    selectedAvatar: '',
    customAvatarUrl: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});

  // Cargar datos del usuario cuando se abre el modal
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

      // Detectar si es un avatar pre-cargado
      const preloadedAvatar = AVATAR_OPTIONS.find(av => 
        data.avatar_url === av.id
      );

      setFormData({
        username: data.username || user.email.split('@')[0],
        selectedAvatar: preloadedAvatar ? data.avatar_url : '',
        customAvatarUrl: !preloadedAvatar ? (data.avatar_url || '') : ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setFormData({
        username: user.email.split('@')[0],
        selectedAvatar: 'avatar-01', // Avatar por defecto
        customAvatarUrl: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar username
    if (!formData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (formData.username.trim().length < 2) {
      newErrors.username = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.username.trim().length > 30) {
      newErrors.username = 'El nombre no puede exceder 30 caracteres';
    } else if (!/^[a-zA-Z0-9_\s]+$/.test(formData.username.trim())) {
      newErrors.username = 'Solo se permiten letras, números, espacios y guiones bajos';
    }

    // Validar avatar
    if (!formData.selectedAvatar && !formData.customAvatarUrl.trim()) {
      newErrors.avatar = 'Selecciona un avatar';
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
      // Verificar si el username ya existe (diferente al usuario actual)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username.trim())
        .neq('id', user.id)
        .single();

      if (existingUser) {
        setErrors({ username: 'Este nombre de usuario ya está en uso' });
        setIsLoading(false);
        return;
      }

      // Determinar avatar URL final
      const finalAvatarUrl = formData.selectedAvatar || formData.customAvatarUrl.trim();

      // Actualizar perfil
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
      
      // Callback para actualizar la UI
      if (onProfileUpdated) {
        onProfileUpdated(data[0]);
      }

      // Cerrar modal después de un delay
      setTimeout(() => {
        onClose();
        setMessage('');
      }, 1500);

    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = (avatarId) => {
    setFormData(prev => ({
      ...prev,
      selectedAvatar: avatarId,
      customAvatarUrl: '' // Limpiar URL personalizada
    }));
    setErrors(prev => ({ ...prev, avatar: '' }));
  };

  const handleCustomUrlChange = (url) => {
    setFormData(prev => ({
      ...prev,
      customAvatarUrl: url,
      selectedAvatar: '' // Limpiar selección de avatar pre-cargado
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
    
    if (formData.customAvatarUrl.trim()) {
      return (
        <img 
          src={formData.customAvatarUrl} 
          alt="Avatar personalizado"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <FiUser className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold text-white">
              Editar Perfil
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
              Nombre de usuario
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
              placeholder="Ingresa tu nombre de usuario"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username}</p>
            )}
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-3">
              Elige tu avatar
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

            {/* Custom Avatar URL */}
            <div className="mt-4">
              <label className="block text-sm text-gray-300 mb-2">
                O ingresa una URL personalizada
              </label>
              <input
                type="url"
                value={formData.customAvatarUrl}
                onChange={(e) => handleCustomUrlChange(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors text-sm"
                placeholder="https://ejemplo.com/mi-avatar.jpg"
              />
            </div>

            {errors.avatar && (
              <p className="mt-1 text-sm text-red-400">{errors.avatar}</p>
            )}
          </div>

          {/* Preview */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-sm text-gray-300 mb-3">
              Vista previa
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
                {getPreviewAvatar()}
                <FiUser className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-white">
                  {formData.username || 'Nombre de usuario'}
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
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}