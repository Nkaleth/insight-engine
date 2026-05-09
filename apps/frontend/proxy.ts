import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

export async function proxy(request: NextRequest) {
  // 2. Extraer la cookie llamada "access_token"
  // (Pista: es un método para "obtener" en inglés)
  const token = request.cookies.get("access_token")?.value;

  // Si no hay token, lo mandamos al callejón (login)
  if (!token) {
    // 3. ¿Qué método de NextResponse usamos para redireccionar?
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Convertimos el string secreto a bytes (exigencia estricta de jose)
    const secret = new TextEncoder().encode(JWT_SECRET);

    // 4. Verificamos el token criptográficamente usando la función importada arriba
    await jwtVerify(token, secret);

    // Si la firma es válida y no ha expirado, dejamos que pase al restaurante
    return NextResponse.next();
  } catch (error) {
    // Si el token es falso o caducó, el bloque try falla y cae aquí.
    // 5. ¿Qué método usamos para mandarlo de vuelta al login?
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

// Configuración del Cadenero (Matcher)
export const config = {
  matcher: [
    // Magia de Regex: Protege TODAS las rutas excepto internos, estáticos y el propio /login
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)"
  ],
};
