import { supabase } from './supabaseClient';

// Cache para evitar requests simultáneos
const pendingRequests = new Map();

export const handleUserSession = async (session) => {
  if (!session?.user) {
    console.log('No hay sesión válida para procesar');
    return false;
  }

  const user = session.user;
  const userId = user.id;
  
  console.log('Guardando usuario:', { id: userId, email: user.email });

  // Verificar si ya hay un request pendiente para este usuario
  if (pendingRequests.has(userId)) {
    console.log('Request ya en progreso para usuario:', user.email);
    try {
      return await pendingRequests.get(userId);
    } catch (error) {
      console.error('Error en request pendiente:', error);
      pendingRequests.delete(userId);
      return false;
    }
  }

  // Crear la promesa con timeout
  const userPromise = Promise.race([
    // Request principal
    (async () => {
      try {
        console.log('Ejecutando upsert para usuario:', user.email);
        
        const { data, error } = await supabase
          .from('users')
          .upsert({
            id: userId,
            email: user.email,
            username: user.user_metadata?.name || 
                     user.user_metadata?.full_name || 
                     user.email.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url || 
                       `https://www.gravatar.com/avatar/${userId}?d=identicon`,
            status: 'online'
            
          }, {
            onConflict: 'id',
            ignoreDuplicates: false
          });

        if (error) {
          console.error('Error en upsert:', error);
          throw error;
        }

        console.log('Usuario actualizado exitosamente:', data);
        return true;

      } catch (error) {
        console.error('Error en handleUserSession:', error.message);
        throw error;
      }
    })(),
    
    // Timeout 
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: handleUserSession tardó más de 20 segundos')), 20000)
    )
  ]);

  // Guardar en cache
  pendingRequests.set(userId, userPromise);

  try {
    const result = await userPromise;
    console.log('handleUserSession completado exitosamente');
    return result;
  } catch (error) {
    console.error('handleUserSession falló:', error.message);
    return false;
  } finally {
    // Limpiar cache
    pendingRequests.delete(userId);
  }
};