"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import {
  useCooperative,
  useUpdateCooperative,
} from "@/hooks/cooperative/user-cooperative";

const cooperativeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  contact_person: z.string().optional(),
  phone_number: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type CooperativeFormData = z.infer<typeof cooperativeSchema>;

export function CooperativeForm() {
  const { toast } = useToast();
  const { data: cooperative, isLoading } = useCooperative();
  const updateCooperative = useUpdateCooperative();

  const form = useForm<CooperativeFormData>({
    resolver: zodResolver(cooperativeSchema),
    defaultValues: {
      name: "",
      location: "",
      contact_person: "",
      phone_number: "",
      status: "ACTIVE",
    },
  });

  // Update form when cooperative data loads
  useEffect(() => {
    if (cooperative) {
      form.reset({
        name: cooperative.name,
        location: cooperative.location || "",
        contact_person: cooperative.contact_person || "",
        phone_number: cooperative.phone_number || "",
        status: cooperative.status,
      });
    }
  }, [cooperative, form]);

  const onSubmit = async (data: CooperativeFormData) => {
    try {
      await updateCooperative.mutateAsync(data);
      toast({
        title: "Success",
        description: "Cooperative updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cooperative",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información de la cooperativa</CardTitle>
        <CardDescription>
          Actualice la información de la cooperativa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la cooperativa</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la cooperativa"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ubicación</FormLabel>
                    <FormControl>
                      <Input placeholder="Ubicación" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contact_person"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la persona de contacto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la persona de contacto"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de telefono</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de telefono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end w-full">
              <Button
                type="submit"
                disabled={updateCooperative.isPending}
                className="ml-auto w-[200px]"
              >
                {updateCooperative.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Actualizar información
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
