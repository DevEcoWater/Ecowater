import { useMutation } from "@tanstack/react-query";
import { signIn } from "next-auth/react";

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  error?: string;
}

interface SignInResponse {
  error?: string | null;
  user?: { id: string; email: string };
  token?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
  };
  token: string;
}

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: async (data) => {
      const result: SignInResponse | undefined = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result || result.error !== null) {
        throw new Error(result?.error || "Login failed");
      }

      return {
        user: {
          id: result.user?.id ?? "",
          email: result.user?.email ?? "",
        },
        token: result.token ?? "",
      };
    },
  });
}

export function useRegister() {
  return useMutation<
    { message: string },
    Error,
    { username: string; email: string; password: string }
  >({
    mutationFn: async (data) => {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Registration failed");
      }

      return await response.json();
    },
  });
}
