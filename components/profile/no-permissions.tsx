import { ShieldX, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function NoPermissions() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center p-8 space-y-6">
          <div className="rounded-full bg-muted p-4">
            <ShieldX className="h-8 w-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Acceso Restringido
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No posees permisos para modificar la configuración de la
              cooperativa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
