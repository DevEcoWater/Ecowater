"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { OcrScanButton } from "./ocr-scan-button";
import { useSubmitReadingMutation } from "@/hooks/portal/use-portal";
import dayjs from "dayjs";

const formSchema = z.object({
  instantaneous_flow: z
    .string()
    .min(1, "El valor de lectura es obligatorio")
    .refine((v) => !isNaN(parseFloat(v)), "Debe ser un número válido"),
  observations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ManualReadingFormProps {
  meterId: string;
  zoneId: string;
  meterName: string;
  userName: string | null;
  lastReadingValue: string | null;
  lastReadingDate: string | null;
  userId: string;
}

export function ManualReadingForm({
  meterId,
  zoneId,
  meterName,
  userName,
  lastReadingValue,
  lastReadingDate,
  userId,
}: ManualReadingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const submitReading = useSubmitReadingMutation(zoneId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { instantaneous_flow: "", observations: "" },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await submitReading.mutateAsync({
        meterId,
        instantaneous_flow: values.instantaneous_flow,
        observations: values.observations,
        submitted_by: userId,
      });
      toast({ title: "Lectura guardada correctamente" });
      router.push(`/portal/zonas/${zoneId}`);
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    }
  };

  return (
    <div className="w-full">
      {/* Meter info card */}
      <div className="mb-5 p-4 rounded-xl bg-muted/50 border">
        <p className="text-sm font-semibold text-foreground">{meterName}</p>
        {userName && <p className="text-xs text-muted-foreground mt-0.5">{userName}</p>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Previous reading (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Lectura Anterior (m³):
            </label>
            <Input
              value={lastReadingValue ?? "Sin lecturas previas"}
              readOnly
              className="h-12 text-base bg-muted/50 text-muted-foreground"
            />
          </div>

          {/* Last reading date (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Fecha Última Lectura:
            </label>
            <Input
              value={
                lastReadingDate
                  ? dayjs(lastReadingDate).format("DD/MM/YYYY")
                  : "—"
              }
              readOnly
              className="h-12 text-base bg-muted/50 text-muted-foreground"
            />
          </div>

          {/* OCR scan button */}
          <OcrScanButton />

          {/* Current reading */}
          <FormField
            control={form.control}
            name="instantaneous_flow"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lectura Actual (m³):</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      className="h-14 text-xl font-mono pr-10"
                    />
                    {field.value && !isNaN(parseFloat(field.value)) && (
                      <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Observations */}
          <FormField
            control={form.control}
            name="observations"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Observaciones (opcional)"
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-base font-semibold"
            disabled={submitReading.isPending}
          >
            {submitReading.isPending ? "Guardando..." : "Guardar Lectura"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
