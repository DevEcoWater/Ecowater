"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle } from "lucide-react";
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
import { formatDateAR } from "@/lib/utils";

const MAX_OCR_ATTEMPTS = 3;

const createFormSchema = (lastReadingValue: string | null) =>
  z.object({
    instantaneous_flow: z
      .string()
      .min(1, "El valor de lectura es obligatorio")
      .refine((v) => !isNaN(parseFloat(v)), "Debe ser un número válido")
      .refine((v) => {
        const previous = lastReadingValue ? parseFloat(lastReadingValue) : null;
        if (previous === null || isNaN(previous)) return true;
        return parseFloat(v) >= previous;
      }, "La lectura no puede ser menor a la lectura anterior"),
    observations: z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

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

  // --- OCR state machine ---
  // capturedImage: last compressed data-URI (always saved, even on OCR failure)
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  // ocrSuccess: OCR returned a readable value on the latest scan
  const [ocrSuccess, setOcrSuccess] = useState(false);
  // failedAttempts: unified counter — OCR failures + "value is incorrect" actions
  const [failedAttempts, setFailedAttempts] = useState(0);

  const manualUnlocked = failedAttempts >= MAX_OCR_ATTEMPTS;

  const formSchema = useMemo(
    () => createFormSchema(lastReadingValue),
    [lastReadingValue]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { instantaneous_flow: "", observations: "" },
  });

  // When manual entry is unlocked, pre-fill the observations field
  useEffect(() => {
    if (manualUnlocked) {
      form.setValue(
        "observations",
        "OCR/valor falló 3 veces. Valor ingresado manualmente.",
        { shouldValidate: false }
      );
    }
  }, [manualUnlocked, form]);

  // --- Handlers ---
  const handleImageCaptured = (dataUri: string) => {
    setCapturedImage(dataUri);
    setOcrSuccess(false);
  };

  const handleOcrResult = (value: string) => {
    form.setValue("instantaneous_flow", value, { shouldValidate: true });
    setOcrSuccess(true);
  };

  const handleOcrFailure = () => {
    setFailedAttempts((n) => n + 1);
    setOcrSuccess(false);
  };

  const handleValueIncorrect = () => {
    form.setValue("instantaneous_flow", "", { shouldValidate: false });
    setOcrSuccess(false);
    setFailedAttempts((n) => n + 1);
  };

  const onSubmit = async (values: FormValues) => {
    // Guard: photo is mandatory
    if (!capturedImage) {
      toast({
        title: "Sacá una foto del medidor primero",
        variant: "destructive",
      });
      return;
    }

    // Guard: observations required when submitted manually
    if (manualUnlocked && (!values.observations || values.observations.trim().length === 0)) {
      form.setError("observations", {
        message: "La observación es obligatoria cuando se carga manualmente",
      });
      return;
    }

    try {
      await submitReading.mutateAsync({
        meterId,
        instantaneous_flow: values.instantaneous_flow,
        observations: values.observations,
        photo_url: capturedImage,
        submitted_by: userId,
      });
      toast({ title: "Lectura guardada correctamente" });
      router.push(`/portal/zonas/${zoneId}`);
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    }
  };

  // Determine scan button label
  const scanLabel =
    failedAttempts === 0
      ? "Escanear Medidor"
      : `Reintentar escaneo (intento ${failedAttempts + 1} de ${MAX_OCR_ATTEMPTS})`;

  const canSubmit = capturedImage !== null && (ocrSuccess || manualUnlocked);

  // Derive current step for stepper
  const currentStep = !capturedImage ? 1 : !ocrSuccess && !manualUnlocked ? 2 : 3;
  const steps = [
    { n: 1, label: "Foto" },
    { n: 2, label: "Lectura" },
    { n: 3, label: "Confirmar" },
  ];

  return (
    <div className="w-full">
      {/* Reference card — compact meter context */}
      <div className="rounded-xl border bg-blue-50 border-blue-100 p-4 space-y-1 mb-5">
        <p className="text-base font-semibold text-gray-900 leading-tight">{meterName}</p>
        {userName && (
          <p className="text-sm text-gray-500">{userName}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {lastReadingValue ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white border border-blue-200 text-blue-700">
              Última lectura: {lastReadingValue} m³
            </span>
          ) : (
            <span className="text-xs text-gray-400">Sin lecturas previas</span>
          )}
          {lastReadingDate && (
            <span className="text-xs text-gray-400">
              {formatDateAR(lastReadingDate)}
            </span>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-6">
        {steps.map((s, i) => {
          const done = currentStep > s.n;
          const active = currentStep === s.n;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                    done
                      ? "bg-green-500 border-green-500 text-white"
                      : active
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-gray-300 text-gray-400"
                  }`}
                >
                  {done ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <span
                  className={`text-xs font-medium ${
                    done ? "text-green-600" : active ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mb-5 mx-1 ${done ? "bg-green-400" : "bg-gray-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* ── STEP 1: capture photo ───────────────────────────────────────── */}

          {/* Preview of captured image */}
          {capturedImage && (
            <div className="rounded-lg overflow-hidden border bg-gray-50">
              <img
                src={capturedImage}
                alt="Foto del medidor"
                className="w-full object-contain max-h-56"
              />
            </div>
          )}

          {/* Retake photo button — shown when photo taken but OCR not yet succeeded */}
          {capturedImage && !ocrSuccess && !manualUnlocked && (
            <button
              type="button"
              onClick={() => {
                setCapturedImage(null);
                setOcrSuccess(false);
              }}
              className="text-xs text-gray-500 underline underline-offset-2 text-center w-full"
            >
              Volver a sacar la foto
            </button>
          )}

          {/* Scan button — hidden once manual entry is unlocked */}
          {!manualUnlocked && (
            <OcrScanButton
              meterId={meterId}
              label={scanLabel}
              onImageCaptured={handleImageCaptured}
              onOcrResult={handleOcrResult}
              onOcrFailure={handleOcrFailure}
            />
          )}

          {/* Hint when no photo yet */}
          {!capturedImage && (
            <p className="text-sm text-muted-foreground text-center py-1">
              Sacá una foto del medidor para comenzar la lectura
            </p>
          )}

          {/* Failure counter feedback */}
          {capturedImage && !ocrSuccess && !manualUnlocked && failedAttempts > 0 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                Intento {failedAttempts} de {MAX_OCR_ATTEMPTS} fallido — intentá con mejor
                iluminación o ángulo
              </span>
            </div>
          )}

          {/* ── STEP 2: confirm or reject OCR value ────────────────────────── */}

          {/* Current reading — shown after OCR succeeds or manual is unlocked */}
          {(ocrSuccess || manualUnlocked) && (
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
                        readOnly={ocrSuccess && !manualUnlocked}
                        className={`h-14 text-xl font-mono pr-10 ${
                          ocrSuccess && !manualUnlocked ? "bg-muted/50" : ""
                        }`}
                      />
                      {ocrSuccess && !manualUnlocked && (
                        <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </FormControl>
                  {ocrSuccess && !manualUnlocked && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Valor leído por IA
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* "Value is incorrect" — triggers another scan attempt */}
          {ocrSuccess && !manualUnlocked && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleValueIncorrect}
              className="text-amber-600 border-amber-200 hover:bg-amber-50"
            >
              El valor es incorrecto — volver a escanear
            </Button>
          )}

          {/* ── STEP 3: observations (always optional; required when manual) ── */}

          {(ocrSuccess || manualUnlocked) && (
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Observaciones{manualUnlocked ? " *" : " (opcional)"}:
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        manualUnlocked
                          ? "Explicá por qué se ingresó manualmente"
                          : "Observaciones (opcional)"
                      }
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Sticky submit CTA */}
          <div className="sticky bottom-0 pt-3 pb-2 bg-white border-t border-gray-100 -mx-4 px-4 mt-2">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white h-14 text-base font-semibold"
              disabled={submitReading.isPending || !canSubmit}
            >
              {submitReading.isPending ? "Guardando..." : "Guardar Lectura"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
