import Axios from 'axios';

// 1. Creamos la instancia base con una configuración por defecto
export const apiClient = Axios.create({
  // 2. ¿Qué propiedad de Axios define la URL raíz de todas las peticiones?
  baseURL: process.env.NEXT_PUBLIC_API_URL,

  // 3. ¿Qué propiedad define el tiempo máximo de espera en milisegundos? (Ej: 10 segundos)
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json',
  },
});

// Nota: En un futuro sprint, aquí conectaremos el Interceptor de JWT.
