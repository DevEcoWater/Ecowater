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
import { Loader } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const schema = zod.object({
  email: zod.string().min(1, { message: "Email is required" }).email(),
  password: zod.string().min(1, { message: "Password is required" }),
});

type Values = zod.infer<typeof schema>;

const defaultValues = {
  email: "",
  password: "",
} satisfies Values;

const LoginForm = () => {
  const { mutate: login } = useLogin();
  const [loading, setLoading] = useState(false);

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
          <Controller
            control={control}
            name="password"
            rules={{ required: "Este campo es obligatorio" }}
            render={({ field }) => (
              <Input
                {...field}
                id="password"
                type="password"
                placeholder="********"
                required
                className={errors.password ? "border-red-500" : ""}
              />
            )}
          />
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
