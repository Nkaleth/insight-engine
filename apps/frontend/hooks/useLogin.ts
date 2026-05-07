"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { apiClient } from "../lib/api.client";

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  access_token: string;
}

export function useLogin() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<LoginResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Guardamos el JWT en una cookie accesible por el proxy (middleware)
      // Expira en 24 horas
      const expires = new Date();
      expires.setTime(expires.getTime() + 24 * 60 * 60 * 1000);
      document.cookie = `access_token=${data.access_token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;

      // Redirigimos al dashboard principal
      router.push("/");
      router.refresh();
    },
  });
}
