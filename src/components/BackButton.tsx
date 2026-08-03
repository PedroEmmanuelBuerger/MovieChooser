import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = "Voltar" }: BackButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="mb-6 -ml-2 w-fit text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <ArrowLeft aria-hidden />
      {label}
    </Button>
  );
}
