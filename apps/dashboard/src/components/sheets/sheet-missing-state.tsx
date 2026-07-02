import { Button, Card, CardContent } from "@afterservice/ui";

type SheetMissingStateProps = {
  description: string;
  onClose: () => void;
  title: string;
};

export function SheetMissingState({
  description,
  onClose,
  title,
}: SheetMissingStateProps) {
  return (
    <Card className="mt-6">
      <CardContent className="flex flex-col items-start gap-4 p-6">
        <div className="space-y-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </CardContent>
    </Card>
  );
}
