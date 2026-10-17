"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Check, MapPin, User, Calendar, AlertTriangle, Camera, CheckCircle2, Loader2 } from "lucide-react";
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
import { useSubmitReadingMutation, useReadingAttemptMutation } from "@/hooks/portal/use-portal";
import { OcrFormState } from "@/types/portal/reading-attempt-types";
import { cn } from "@/lib/utils";
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
  streetAddress: string | null;
  userName: string | null;
  lastReadingValue: string | null;
  lastReadingDate: string | null;
  userId: string;
}

const MAX_ATTEMPTS = 3;

function OcrStepBanner({
  state,
  attemptCount,
  maxAttempts,
}: {
  state: OcrFormState;
  attemptCount: number;
  maxAttempts: number;
}) {
  const config = {
    idle: {
      Icon: attemptCount > 0 ? AlertTriangle : Camera,
      iconClass: attemptCount > 0 ? "text-amber-500" : "text-blue-500",
      wrapClass: attemptCount > 0 ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200",
      title: attemptCount > 0 ? "Intento fallido — volvé a escanear" : "Escaneá el medidor",
      subtitle:
        attemptCount > 0
          ? `Quedan ${maxAttempts - attemptCount} intento${maxAttempts - attemptCount !== 1 ? "s" : ""}`
          : "Tomá una foto para detectar el valor automáticamente",
    },
    processing: {
      Icon: Loader2,
      iconClass: "text-blue-500 animate-spin",
      wrapClass: "bg-blue-50 border-blue-200",
      title: "Procesando imagen...",
      subtitle: "Aguardá un momento",
    },
    confirming: {
      Icon: CheckCircle2,
      iconClass: "text-green-500",
      wrapClass: "bg-green-50 border-green-200",
      title: "Valor detectado por OCR",
      subtitle: "Revisá el número y confirmá — podés corregirlo si es necesario",
    },
    manual_forced: {
      Icon: AlertTriangle,
      iconClass: "text-amber-500",
      wrapClass: "bg-amber-50 border-amber-200",
      title: "Ingresá el valor manualmente",
      subtitle: "No fue posible leer el medidor. Escribí la lectura a mano.",
    },
  }[state];

  const showDots = state === "idle" && attemptCount > 0;

  return (
    <div className={cn("rounded-xl border p-4 flex gap-3 items-start", config.wrapClass)}>
      <config.Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconClass)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">{config.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{config.subtitle}</p>
        {showDots && (
          <div className="flex gap-1.5 mt-2">
            {Array.from({ length: maxAttempts }).map((_, i) => (
              <span
                key={i}
                className={cn("w-2.5 h-2.5 rounded-full", i < attemptCount ? "bg-red-400" : "bg-gray-200")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ManualReadingForm({
  meterId,
  zoneId,
  meterName,
  streetAddress,
  userName,
  lastReadingValue,
  lastReadingDate,
  userId,
}: ManualReadingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const submitReading = useSubmitReadingMutation(zoneId);
  const saveAttempt = useReadingAttemptMutation(meterId);

  const [ocrState, setOcrState] = useState<OcrFormState>("idle");
  const [attemptCount, setAttemptCount] = useState(0);
  const [capturedImagePath, setCapturedImagePath] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { instantaneous_flow: "", observations: "" },
  });

  const handleOcrStart = () => setOcrState("processing");

  const handleOcrSuccess = async (value: string, imagePath: string) => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    setCapturedImagePath(imagePath);
    try {
      await saveAttempt.mutateAsync({
        meter_id: meterId,
        success: true,
        image_path: imagePath,
        value_detected: value,
        submitted_by: userId,
      });
    } catch {
      // Non-fatal — the reading still proceeds
    }
    form.setValue("instantaneous_flow", value);
    setOcrState("confirming");
  };

  const handleOcrFailure = async (imagePath: string, error: string) => {
    const newCount = attemptCount + 1;
    setAttemptCount(newCount);
    if (imagePath) setCapturedImagePath(imagePath);
    try {
      await saveAttempt.mutateAsync({
        meter_id: meterId,
        success: false,
        image_path: imagePath,
        error_message: error,
        submitted_by: userId,
      });
    } catch {
      // Non-fatal
    }
    if (newCount >= MAX_ATTEMPTS) {
      setOcrState("manual_forced");
      toast({
        title: "No fue posible leer el medidor automáticamente.",
        description: "Ingresá el valor manualmente.",
        variant: "destructive",
      });
    } else {
      setOcrState("idle");
      toast({
        title: `Intento ${newCount} de ${MAX_ATTEMPTS} fallido`,
        description: error,
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (lastReadingValue !== null) {
      const newVal = parseFloat(values.instantaneous_flow);
      const prevVal = parseFloat(lastReadingValue);
      if (!isNaN(prevVal) && !isNaN(newVal) && newVal < prevVal) {
        form.setError("instantaneous_flow", {
          type: "manual",
          message: "El valor ingresado no es válido. Verifique la lectura.",
        });
        return;
      }
    }
    try {
      await submitReading.mutateAsync({
        meterId,
        instantaneous_flow: values.instantaneous_flow,
        observations: values.observations,
        submitted_by: userId,
        photo_url: capturedImagePath ?? undefined,
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
      <div className="mb-6 rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="h-1 bg-green-500" />
        <div className="p-4 space-y-2.5">
          <p className="text-base font-bold text-foreground leading-tight">{meterName}</p>
          {streetAddress && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 shrink-0 text-green-600" />
              <span>{streetAddress}</span>
            </div>
          )}
          {userName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 shrink-0 text-blue-500" />
              <span>{userName}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0 text-orange-400" />
            <span>
              Última lectura:{" "}
              <span className="font-medium text-foreground">
                {lastReadingDate
                  ? dayjs(lastReadingDate).format("DD/MM/YYYY")
                  : "Sin lecturas previas"}
              </span>
            </span>
          </div>
        </div>
      </div>

      <OcrStepBanner state={ocrState} attemptCount={attemptCount} maxAttempts={MAX_ATTEMPTS} />

      <div className="mt-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* OCR scan button — hidden once manual entry is forced */}
          {ocrState !== "manual_forced" && (
            <div className="space-y-1.5">
              <OcrScanButton
                meterId={meterId}
                attemptCount={attemptCount}
                maxAttempts={MAX_ATTEMPTS}
                onStart={handleOcrStart}
                onSuccess={handleOcrSuccess}
                onFailure={handleOcrFailure}
                disabled={ocrState === "processing" || ocrState === "confirming"}
              />
            </div>
          )}

          {/* Divider */}
          <div className="relative flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Registrar lectura
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Input hint — context-aware */}
          {(ocrState === "idle" || ocrState === "processing") && (
            <p className="text-xs text-muted-foreground text-center">
              Completá el escaneo para habilitar este campo
            </p>
          )}

          {/* Current reading */}
          <FormField
            control={form.control}
            name="instantaneous_flow"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-foreground">
                  Lectura Actual
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      disabled={ocrState === "idle" || ocrState === "processing"}
                      className={cn(
                        "h-16 text-2xl font-mono pr-16 focus-visible:ring-green-500",
                        ocrState === "confirming" &&
                          "ring-2 ring-green-400 border-green-400"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground pointer-events-none">
                      m³
                    </span>
                    {field.value && !isNaN(parseFloat(field.value)) && (
                      <Check className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
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
                <FormLabel className="text-sm font-semibold text-foreground">
                  Observaciones
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Opcional — anomalías, daños, acceso dificultoso..."
                    className="resize-none text-sm"
                    rows={3}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white h-13 text-base font-semibold shadow-sm"
            disabled={submitReading.isPending || ocrState === "processing" || ocrState === "idle"}
          >
            {submitReading.isPending
              ? "Guardando..."
              : ocrState === "confirming"
              ? "Confirmar y guardar"
              : "Guardar Lectura"}
          </Button>
        </form>
      </Form>
      </div>
    </div>
  );
}
