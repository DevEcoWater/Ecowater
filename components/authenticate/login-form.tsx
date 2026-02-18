"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@/hooks/useLogin";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { Loader, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const schema = zod.object({
  email: zod.string().min(1, { message: "El email es requerido" }).email(),
  password: zod.string().min(1, { message: "La contraseña es requerida" }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = {
  email: "",
  password: "",
} satisfies Values;

const LoginForm = () => {
  const { mutate: login } = useLogin();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Values>({ defaultValues, resolver: zodResolver(schema) });

  const onSubmit = (data: Values) => {
    setLoading(true);
    login(data, {
      onSuccess: () => {
        toast({
          title: "Inicio de sesión exitoso",
          description: "Bienvenido al panel.",
        });
        setLoading(false);
        router.push("/dashboard");
      },
      onError: (error) => {
        toast({
          title: "Error en el inicio de sesión",
          description: "Ha ocurrido un error en el inicio de sesión.",
          variant: "destructive",
        });
        setLoading(false);
      },
    });
  };

  return (
    <form
      className={cn("flex flex-col gap-6")}
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Bienvenido!👋</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Por favor ingrese su email y contraseña.
        </p>
      </div>
      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Este campo es obligatorio",
              pattern: /^\S+@\S+\.\S+$/,
            }}
            render={({ field }) => (
              <Input
                {...field}
                id="email"
                type="email"
                placeholder="ejemplo@mail.com"
                required
                className={errors.email ? "border-red-500" : ""}
              />
            )}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email.message}</p>
          )}
        </div>

        <div className="grid gap-2">
          <div className="flex items-center">
            <Label htmlFor="password">Contraseña</Label>
          </div>
          <div className="relative">
            <Controller
              control={control}
              name="password"
              rules={{ required: "Este campo es obligatorio" }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="********"
                  required
                  className={cn(
                    errors.password ? "border-red-500 pr-10" : "pr-10",
                  )}
                />
              )}
            />
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className={`w-full ${loading ? "opacity-70" : ""}`}
        >
          {loading ? <Loader className="animate-spin" size={20} /> : "Ingresar"}
        </Button>
      </div>
    </form>
  );
};

export default LoginForm;
