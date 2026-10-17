"use client";

import React, { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SecureDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  /** Texto que hay que escribir para habilitar el borrado */
  confirmText: string;
  /** Recibe la contraseña y el texto escrito; si lanza, se muestra el error */
  onConfirm: (input: { password: string; confirmText: string }) => Promise<void>;
  isPending?: boolean;
}

/**
 * Confirmación de borrado irreversible: hay que escribir un texto exacto y
 * reingresar la contraseña de la cuenta (el servidor la verifica).
 */
export function SecureDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText,
  onConfirm,
  isPending = false,
}: SecureDeleteDialogProps) {
  const [typed, setTyped] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = typed.trim() === confirmText && password.length > 0 && !isPending;

  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (!next) {
      setTyped("");
      setPassword("");
      setError(null);
    }
    onOpenChange(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await onConfirm({ password, confirmText: typed.trim() });
      handleOpenChange(false);
    } catch (err: any) {
      setError(err.message);
      setPassword("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {title}
            </DialogTitle>
            <DialogDescription asChild>
              <div>{description}</div>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="secure-delete-confirm">
              Escribí <span className="font-mono font-semibold break-all">{confirmText}</span> para confirmar
            </Label>
            <Input
              id="secure-delete-confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="secure-delete-password">Tu contraseña</Label>
            <Input
              id="secure-delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <p className="text-xs text-muted-foreground">
              Por seguridad, confirmá tu identidad con la contraseña de tu cuenta.
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={!canSubmit}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Eliminar definitivamente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
