"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@prisma/client";
import { MoreHorizontal, User2, Gauge, Pencil, Cpu, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface MeterActionsProps {
  meter: TMeterInfo;
  onViewDetails?: (user: MeterDataForTable) => void;
  onEdit?: (MeterDataForTable: MeterDataForTable) => void;
  onViewMeter?: (MeterDataForTable: MeterDataForTable) => void;
  onDelete?: (MeterDataForTable: User) => void;
}

type TMeterInfo = {
  meter_id: string;
  user_id?: string;
  meter_type?: string;
  device_name?: string;
  street_address?: string;
  dev_eui?: string;
};

const editSchema = z.object({
  device_name: z.string().min(1, "El nombre es obligatorio"),
  street_address: z.string().min(1, "La dirección es obligatoria"),
  dev_eui: z.string().optional(),
});

type EditFormValues = z.infer<typeof editSchema>;

export const MeterActions = ({ meter }: MeterActionsProps) => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isMechanical = meter.meter_type === "MECHANICAL";

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      device_name: meter.device_name ?? "",
      street_address: meter.street_address ?? "",
      dev_eui: meter.dev_eui ?? "",
    },
  });

  const handleViewMeter = () => {
    router.push(`/dashboard/medidores/${meter.meter_id}`);
  };

  const handleViewUser = () => {
    router.push(`/dashboard/usuarios/${meter.user_id}`);
  };

  const onSubmitEdit = async (values: EditFormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/meter/${meter.meter_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_name: values.device_name,
          street_address: values.street_address,
          dev_eui: values.dev_eui || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? "Error al guardar");
      }
      toast({ title: "Medidor actualizado" });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["meters"] });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} collisionPadding={10}>
          <DropdownMenuLabel className="flex items-center gap-2">
            {isMechanical ? (
              <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                <Wrench className="w-3 h-3" /> Mecánico
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5">
                <Cpu className="w-3 h-3" /> Inteligente
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {meter.user_id ? (
            <DropdownMenuItem
              className="flex items-center gap-2 cursor-pointer"
              onSelect={handleViewUser}
            >
              <User2 className="h-4 w-4" />
              Detalle de usuario
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled>
              No hay usuario asociado
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2"
            onSelect={handleViewMeter}
          >
            <Gauge className="h-4 w-4" />
            Detalle del medidor
          </DropdownMenuItem>

          {isMechanical && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer flex items-center gap-2"
                onSelect={() => {
                  form.reset({
                    device_name: meter.device_name ?? "",
                    street_address: meter.street_address ?? "",
                    dev_eui: meter.dev_eui ?? "",
                  });
                  setEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
                Editar medidor
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isMechanical && (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar medidor mecánico</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="device_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del medidor</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="street_address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dev_eui"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        ID del medidor{" "}
                        <span className="text-muted-foreground font-normal">(opcional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 0012AB34CD56EF78" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
