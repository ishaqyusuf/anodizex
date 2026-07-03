"use client";

import type { AppRouter } from "@anodizex/api/router";
import {
  createQuotationMaterialSupplierPriceSchema,
  createProjectQuotationSchema,
  createQuotationMaterialSchema,
  updateQuotationMaterialCostSchema,
} from "@anodizex/api/schemas";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CurrencyInput,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@anodizex/ui";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@anodizex/ui/form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format } from "date-fns";
import {
  Calculator,
  PackagePlus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { useZodForm } from "@/hooks/use-zod-form";
import { useTRPC } from "@/trpc/client";

type QuotationsList =
  inferRouterOutputs<AppRouter>["quotations"]["list"]["items"];
type Quotation = QuotationsList[number];
type Material =
  inferRouterOutputs<AppRouter>["quotations"]["materials"]["list"]["items"][number];
type QuotationFormValues = z.output<typeof createProjectQuotationSchema>;
type MaterialFormValues = z.output<typeof createQuotationMaterialSchema>;
type MaterialCostFormValues = z.output<
  typeof updateQuotationMaterialCostSchema
>;
type SupplierPriceFormValues = z.output<
  typeof createQuotationMaterialSupplierPriceSchema
>;
type QuotationStatus = QuotationFormValues["status"];

const statusLabels: Record<QuotationStatus, string> = {
  approved: "Approved",
  declined: "Declined",
  draft: "Draft",
  expired: "Expired",
  sent: "Sent",
};

const statusVariants: Record<
  QuotationStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  approved: "default",
  declined: "destructive",
  draft: "secondary",
  expired: "outline",
  sent: "outline",
};

export function ProjectQuotationManager() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("quotations");
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(
    null,
  );

  const quotationsQuery = useQuery(
    trpc.quotations.list.queryOptions({ limit: 50 }),
  );
  const materialsQuery = useQuery(
    trpc.quotations.materials.list.queryOptions({ includeArchived: false }),
  );
  const quotations = quotationsQuery.data?.items ?? [];
  const materials = materialsQuery.data?.items ?? [];
  const selectedId = selectedQuotationId ?? quotations[0]?.id ?? null;
  const detailQuery = useQuery({
    ...trpc.quotations.get.queryOptions({ id: selectedId ?? "" }),
    enabled: Boolean(selectedId),
  });
  const selectedQuotation =
    detailQuery.data?.item ??
    quotations.find((quotation) => quotation.id === selectedId) ??
    null;

  useEffect(() => {
    if (!selectedQuotationId && quotations[0]?.id) {
      setSelectedQuotationId(quotations[0].id);
    }
  }, [quotations, selectedQuotationId]);

  const invalidateQuotations = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.quotations.list.queryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: trpc.quotations.get.queryKey(),
    });
  };
  const invalidateMaterials = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.quotations.materials.list.queryKey(),
    });
  };
  const updateStatusMutation = useMutation(
    trpc.quotations.updateStatus.mutationOptions({
      onSuccess: ({ item }) => {
        setSelectedQuotationId(item.id);
        invalidateQuotations();
      },
    }),
  );

  if (quotationsQuery.isPending || materialsQuery.isPending) {
    return <QuotationSkeleton />;
  }

  if (quotationsQuery.error || materialsQuery.error) {
    return (
      <Alert>
        <AlertTitle>Quotation data unavailable</AlertTitle>
        <AlertDescription>
          Reload the page or check that your workspace session is active.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="quotations">Quotations</TabsTrigger>
        <TabsTrigger value="builder">New quotation</TabsTrigger>
        <TabsTrigger value="materials">Materials</TabsTrigger>
      </TabsList>

      <TabsContent value="quotations" className="mt-0">
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <QuotationList
            quotations={quotations}
            selectedId={selectedId}
            onSelect={setSelectedQuotationId}
          />
          <QuotationDetail
            quotation={selectedQuotation}
            isLoading={detailQuery.isFetching}
            onStatusChange={(status) => {
              if (!selectedId) return;
              updateStatusMutation.mutate({ id: selectedId, status });
            }}
            isStatusPending={updateStatusMutation.isPending}
          />
        </div>
      </TabsContent>

      <TabsContent value="builder" className="mt-0">
        <QuotationBuilder
          materials={materials}
          onCreated={(quotationId) => {
            setSelectedQuotationId(quotationId);
            invalidateQuotations();
            setTab("quotations");
          }}
        />
      </TabsContent>

      <TabsContent value="materials" className="mt-0">
        <MaterialLibrary
          materials={materials}
          onChanged={() => {
            invalidateMaterials();
            invalidateQuotations();
          }}
        />
      </TabsContent>
    </Tabs>
  );
}

function QuotationList({
  onSelect,
  quotations,
  selectedId,
}: {
  onSelect: (id: string) => void;
  quotations: Quotation[];
  selectedId: string | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project quotations</CardTitle>
        <CardDescription>
          Select a saved quotation to review BOQ lines and totals.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {quotations.length ? (
          quotations.map((quotation) => {
            const status = toQuotationStatus(quotation.status);

            return (
              <button
                key={quotation.id}
                type="button"
                onClick={() => onSelect(quotation.id)}
                className={`border p-4 text-left transition-colors ${
                  quotation.id === selectedId
                    ? "border-primary bg-accent"
                    : "hover:bg-accent"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {quotation.projectName}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {quotation.quotationNumber}
                    </p>
                  </div>
                  <Badge variant={statusVariants[status]}>
                    {statusLabels[status]}
                  </Badge>
                </div>
                <div className="mt-4 flex items-end justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {quotation.clientName ||
                      quotation.customer?.name ||
                      "No client"}
                  </p>
                  <p className="text-sm font-semibold">
                    {formatMoney(quotation.totalCents, quotation.currency)}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="border border-dashed p-6 text-sm text-muted-foreground">
            No quotations yet. Create a BOQ quotation from the builder tab.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuotationDetail({
  isLoading,
  isStatusPending,
  onStatusChange,
  quotation,
}: {
  isLoading: boolean;
  isStatusPending: boolean;
  onStatusChange: (status: QuotationStatus) => void;
  quotation: Quotation | null;
}) {
  if (isLoading && !quotation) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!quotation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quotation detail</CardTitle>
          <CardDescription>
            Create or select a quotation to see the BOQ breakdown.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const status = toQuotationStatus(quotation.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{quotation.projectName}</CardTitle>
              <Badge variant={statusVariants[status]}>
                {statusLabels[status]}
              </Badge>
            </div>
            <CardDescription>
              {quotation.quotationNumber} ·{" "}
              {quotation.clientName || quotation.customer?.name || "No client"}{" "}
              · {format(new Date(quotation.createdAt), "MMM d, yyyy")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["draft", "sent", "approved", "declined"] as const).map(
              (status) => (
                <Button
                  key={status}
                  type="button"
                  size="sm"
                  variant={quotation.status === status ? "default" : "outline"}
                  disabled={isStatusPending}
                  onClick={() => onStatusChange(status)}
                >
                  {statusLabels[status]}
                </Button>
              ),
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric
            label="Material"
            value={formatMoney(
              quotation.materialSubtotalCents,
              quotation.currency,
            )}
          />
          <Metric
            label="Labor"
            value={formatMoney(
              quotation.laborSubtotalCents,
              quotation.currency,
            )}
          />
          <Metric
            label={`Markup ${quotation.markupPercent}%`}
            value={formatMoney(quotation.markupCents, quotation.currency)}
          />
          <Metric
            label="Total"
            value={formatMoney(quotation.totalCents, quotation.currency)}
            strong
          />
        </div>

        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>BOQ unit</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Materials</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotation.units.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="font-medium">{unit.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {unit.location || unit.unitType}
                    </div>
                  </TableCell>
                  <TableCell>
                    {unit.widthMm} × {unit.heightMm} mm
                  </TableCell>
                  <TableCell>{unit.quantity}</TableCell>
                  <TableCell>{unit.areaSqm.toFixed(2)} sqm</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {unit.materialLines.map((line) => (
                        <span key={line.id} className="text-xs">
                          {line.materialName}
                          {line.supplierName ? ` (${line.supplierName})` : ""}
                          : {line.quantity} {line.unit}/unit
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatMoney(unit.totalCents, quotation.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function QuotationBuilder({
  materials,
  onCreated,
}: {
  materials: Material[];
  onCreated: (id: string) => void;
}) {
  const trpc = useTRPC();
  const form = useZodForm({
    schema: createProjectQuotationSchema,
    defaultValues: defaultQuotationValues(),
  });
  const unitArray = useFieldArray({
    control: form.control,
    name: "units",
  });
  const watched = form.watch();
  const preview = useMemo(() => calculatePreview(watched), [watched]);
  const mutation = useMutation(
    trpc.quotations.create.mutationOptions({
      onSuccess: ({ item }) => {
        form.reset(defaultQuotationValues());
        onCreated(item.id);
      },
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build project quotation</CardTitle>
        <CardDescription>
          Enter each window or door type, dimensions, material consumption, and
          markup. Material costs are copied into the quote when saved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="flex flex-col gap-6"
          >
            <div className="grid gap-5 lg:grid-cols-3">
              <TextField
                control={form.control}
                name="projectName"
                label="Project name"
              />
              <TextField
                control={form.control}
                name="clientName"
                label="Client name"
              />
              <TextField
                control={form.control}
                name="clientEmail"
                label="Client email"
                type="email"
              />
              <TextField
                control={form.control}
                name="siteAddress"
                label="Site address"
              />
              <CurrencyField
                control={form.control}
                name="markupPercent"
                label="Markup percentage"
                suffix="%"
              />
              <DateField
                control={form.control}
                name="validUntil"
                label="Valid until"
              />
            </div>

            <LongTextField control={form.control} name="notes" label="Notes" />

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-medium">BOQ units</h2>
                  <p className="text-sm text-muted-foreground">
                    Add each repeated window, door, facade bay, or sliding
                    system as its own unit row.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    unitArray.append(
                      emptyQuotationUnit(unitArray.fields.length + 1),
                    )
                  }
                >
                  <Plus data-icon="inline-start" />
                  Add unit
                </Button>
              </div>

              {unitArray.fields.map((field, unitIndex) => (
                <QuotationUnitFields
                  key={field.id}
                  canRemove={unitArray.fields.length > 1}
                  form={form}
                  materials={materials}
                  unitIndex={unitIndex}
                  onRemove={() => unitArray.remove(unitIndex)}
                />
              ))}
            </div>

            <div className="grid gap-3 border bg-accent/40 p-4 md:grid-cols-4">
              <Metric
                label="Material subtotal"
                value={formatMoney(
                  preview.materialSubtotalCents,
                  watched.currency,
                )}
              />
              <Metric
                label="Labor subtotal"
                value={formatMoney(
                  preview.laborSubtotalCents,
                  watched.currency,
                )}
              />
              <Metric
                label="Markup"
                value={formatMoney(preview.markupCents, watched.currency)}
              />
              <Metric
                label="Final quote"
                value={formatMoney(preview.totalCents, watched.currency)}
                strong
              />
            </div>

            <Button type="submit" disabled={mutation.isPending}>
              <Save data-icon="inline-start" />
              {mutation.isPending ? "Saving quotation..." : "Save quotation"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function QuotationUnitFields({
  canRemove,
  form,
  materials,
  onRemove,
  unitIndex,
}: {
  canRemove: boolean;
  form: UseFormReturn<QuotationFormValues>;
  materials: Material[];
  onRemove: () => void;
  unitIndex: number;
}) {
  const lineArray = useFieldArray({
    control: form.control,
    name: `units.${unitIndex}.materialLines` as "units.0.materialLines",
  });

  return (
    <div className="border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calculator data-icon="inline-start" />
          <h3 className="text-sm font-medium">Unit {unitIndex + 1}</h3>
        </div>
        {canRemove ? (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 data-icon="inline-start" />
            Remove
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-6">
        <TextField
          control={form.control}
          name={`units.${unitIndex}.label`}
          label="Label"
        />
        <TextField
          control={form.control}
          name={`units.${unitIndex}.location`}
          label="Location"
        />
        <TextField
          control={form.control}
          name={`units.${unitIndex}.unitType`}
          label="Type"
        />
        <NumberField
          control={form.control}
          name={`units.${unitIndex}.widthMm`}
          label="Width mm"
        />
        <NumberField
          control={form.control}
          name={`units.${unitIndex}.heightMm`}
          label="Height mm"
        />
        <NumberField
          control={form.control}
          name={`units.${unitIndex}.quantity`}
          label="Qty"
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <CurrencyField
          control={form.control}
          name={`units.${unitIndex}.laborCostCents`}
          label="Labor per unit"
          cents
        />
        <TextField
          control={form.control}
          name={`units.${unitIndex}.notes`}
          label="Unit notes"
        />
      </div>

      <div className="mt-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium">Material lines</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => lineArray.append(emptyMaterialLine())}
          >
            <Plus data-icon="inline-start" />
            Add material
          </Button>
        </div>

        {lineArray.fields.map((field, lineIndex) => (
          <div
            key={field.id}
            className="grid gap-3 border bg-background p-3 lg:grid-cols-[1.15fr_1.15fr_0.95fr_0.9fr_0.6fr_0.65fr_0.75fr_0.65fr_auto]"
          >
            <MaterialSelectField
              form={form}
              materials={materials}
              unitIndex={unitIndex}
              lineIndex={lineIndex}
            />
            <SupplierPriceSelectField
              form={form}
              materials={materials}
              unitIndex={unitIndex}
              lineIndex={lineIndex}
            />
            <TextField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.materialName`}
              label="Material"
            />
            <TextField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.supplierName`}
              label="Supplier"
            />
            <TextField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.unit`}
              label="Unit"
            />
            <NumberField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.quantity`}
              label="Qty/unit"
              step="0.01"
            />
            <CurrencyField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.unitCostCents`}
              label="Unit cost"
              cents
            />
            <NumberField
              control={form.control}
              name={`units.${unitIndex}.materialLines.${lineIndex}.wastePercent`}
              label="Waste %"
              step="0.1"
            />
            <div className="flex items-end">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={lineArray.fields.length <= 1}
                onClick={() => lineArray.remove(lineIndex)}
              >
                <span className="sr-only">Remove material line</span>
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaterialSelectField({
  form,
  lineIndex,
  materials,
  unitIndex,
}: {
  form: UseFormReturn<QuotationFormValues>;
  lineIndex: number;
  materials: Material[];
  unitIndex: number;
}) {
  const name = `units.${unitIndex}.materialLines.${lineIndex}.materialId`;

  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Library item</FormLabel>
          <Select
            value={field.value || "custom"}
            onValueChange={(value) => {
              if (value === "custom") {
                field.onChange("");
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.supplierPriceId` as never,
                  "" as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                return;
              }

              field.onChange(value);
              const material = materials.find((item) => item.id === value);

              if (material) {
                const preferredPrice =
                  material.supplierPrices.find((price) => price.isPreferred) ??
                  material.supplierPrices[0];
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.materialName` as never,
                  material.name as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.unit` as never,
                  material.unit as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.supplierPriceId` as never,
                  (preferredPrice?.id ?? "") as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.supplierName` as never,
                  (preferredPrice?.supplierName ?? material.supplier) as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.unitCostCents` as never,
                  (preferredPrice?.unitCostCents ??
                    material.currentUnitCostCents) as never,
                  { shouldDirty: true, shouldValidate: true },
                );
              }
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select material" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="custom">Custom material</SelectItem>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ·{" "}
                    {formatMoney(material.currentUnitCostCents)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function SupplierPriceSelectField({
  form,
  lineIndex,
  materials,
  unitIndex,
}: {
  form: UseFormReturn<QuotationFormValues>;
  lineIndex: number;
  materials: Material[];
  unitIndex: number;
}) {
  const materialId = form.watch(
    `units.${unitIndex}.materialLines.${lineIndex}.materialId`,
  );
  const selectedMaterial = materials.find((item) => item.id === materialId);
  const supplierPrices = selectedMaterial?.supplierPrices ?? [];
  const name = `units.${unitIndex}.materialLines.${lineIndex}.supplierPriceId`;

  return (
    <FormField
      control={form.control}
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Supplier price</FormLabel>
          <Select
            value={field.value || "custom"}
            disabled={!selectedMaterial || !supplierPrices.length}
            onValueChange={(value) => {
              if (value === "custom") {
                field.onChange("");
                return;
              }

              field.onChange(value);
              const supplierPrice = supplierPrices.find(
                (item) => item.id === value,
              );

              if (supplierPrice) {
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.supplierName` as never,
                  supplierPrice.supplierName as never,
                  { shouldDirty: true, shouldValidate: true },
                );
                form.setValue(
                  `units.${unitIndex}.materialLines.${lineIndex}.unitCostCents` as never,
                  supplierPrice.unitCostCents as never,
                  { shouldDirty: true, shouldValidate: true },
                );
              }
            }}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="custom">Custom price</SelectItem>
                {supplierPrices.map((supplierPrice) => (
                  <SelectItem key={supplierPrice.id} value={supplierPrice.id}>
                    {supplierPrice.supplierName} ·{" "}
                    {formatMoney(supplierPrice.unitCostCents)}
                    {supplierPrice.isPreferred ? " · Preferred" : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function MaterialLibrary({
  materials,
  onChanged,
}: {
  materials: Material[];
  onChanged: () => void;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <div className="flex flex-col gap-6">
        <MaterialCreateForm onChanged={onChanged} />
        <SupplierPriceForm materials={materials} onChanged={onChanged} />
        <MaterialCostUpdateForm materials={materials} onChanged={onChanged} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Material cost library</CardTitle>
          <CardDescription>
            Current unit costs are used as defaults when building new BOQ
            material lines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Unit cost</TableHead>
                  <TableHead>Supplier prices</TableHead>
                  <TableHead>Recent history</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.length ? (
                  materials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div className="font-medium">{material.name}</div>
                        <div className="text-xs text-muted-foreground">
                          per {material.unit}
                        </div>
                      </TableCell>
                      <TableCell>{material.category || "-"}</TableCell>
                      <TableCell>{material.supplier || "-"}</TableCell>
                      <TableCell>
                        {formatMoney(material.currentUnitCostCents)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs">
                          {material.supplierPrices.length ? (
                            material.supplierPrices.map((price) => (
                              <span key={price.id}>
                                {price.supplierName}:{" "}
                                {formatMoney(price.unitCostCents)}
                                {price.isPreferred ? " · Preferred" : ""}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground">
                              No supplier prices
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          {material.supplierPrices.some(
                            (price) => price.history.length,
                          ) ? (
                            material.supplierPrices
                              .flatMap((price) =>
                                price.history.slice(0, 2).map((history) => ({
                                  ...history,
                                  supplierName: price.supplierName,
                                })),
                              )
                              .slice(0, 4)
                              .map((history) => (
                                <span key={history.id}>
                                  {history.supplierName}:{" "}
                                  {formatMoney(history.unitCostCents)} ·{" "}
                                  {format(
                                    new Date(history.effectiveAt),
                                    "MMM d",
                                  )}
                                </span>
                              ))
                          ) : material.costHistory.length ? (
                            material.costHistory.slice(0, 3).map((history) => (
                              <span key={history.id}>
                                {formatMoney(history.unitCostCents)} ·{" "}
                                {format(new Date(history.effectiveAt), "MMM d")}
                              </span>
                            ))
                          ) : (
                            <span>No history</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Add aluminium profiles, glass, accessories, sealants, and
                      hardware to start building BOQs faster.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MaterialCreateForm({ onChanged }: { onChanged: () => void }) {
  const trpc = useTRPC();
  const form = useZodForm({
    schema: createQuotationMaterialSchema,
    defaultValues: {
      category: "",
      currentUnitCostCents: 0,
      name: "",
      notes: "",
      supplier: "",
      unit: "piece",
    },
  });
  const mutation = useMutation(
    trpc.quotations.materials.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        onChanged();
      },
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add material</CardTitle>
        <CardDescription>
          Store reusable material costs for profiles, glass, hardware, and
          accessories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values: MaterialFormValues) =>
              mutation.mutate(values),
            )}
          >
            <TextField
              control={form.control}
              name="name"
              label="Material name"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="category"
                label="Category"
              />
              <TextField control={form.control} name="unit" label="Unit" />
              <CurrencyField
                control={form.control}
                name="currentUnitCostCents"
                label="Unit cost"
                cents
              />
              <TextField
                control={form.control}
                name="supplier"
                label="Supplier"
              />
            </div>
            <LongTextField control={form.control} name="notes" label="Notes" />
            <Button type="submit" disabled={mutation.isPending}>
              <PackagePlus data-icon="inline-start" />
              {mutation.isPending ? "Adding..." : "Add material"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function SupplierPriceForm({
  materials,
  onChanged,
}: {
  materials: Material[];
  onChanged: () => void;
}) {
  const trpc = useTRPC();
  const [selectedSupplierPriceId, setSelectedSupplierPriceId] =
    useState("new");
  const supplierPrices = materials.flatMap((material) =>
    material.supplierPrices.map((price) => ({
      ...price,
      materialName: material.name,
    })),
  );
  const form = useZodForm({
    schema: createQuotationMaterialSupplierPriceSchema,
    defaultValues: {
      currency: "NGN",
      isPreferred: false,
      materialId: materials[0]?.id ?? "",
      note: "",
      notes: "",
      supplierName: "",
      supplierSku: "",
      unitCostCents: 0,
    },
  });
  const createMutation = useMutation(
    trpc.quotations.materials.supplierPrices.create.mutationOptions({
      onSuccess: () => {
        form.reset({
          currency: "NGN",
          isPreferred: false,
          materialId: form.getValues("materialId"),
          note: "",
          notes: "",
          supplierName: "",
          supplierSku: "",
          unitCostCents: 0,
        });
        setSelectedSupplierPriceId("new");
        onChanged();
      },
    }),
  );
  const updateMutation = useMutation(
    trpc.quotations.materials.supplierPrices.update.mutationOptions({
      onSuccess: () => {
        form.setValue("note", "", { shouldDirty: false });
        onChanged();
      },
    }),
  );
  const archiveMutation = useMutation(
    trpc.quotations.materials.supplierPrices.archive.mutationOptions({
      onSuccess: () => {
        form.reset({
          currency: "NGN",
          isPreferred: false,
          materialId: materials[0]?.id ?? "",
          note: "",
          notes: "",
          supplierName: "",
          supplierSku: "",
          unitCostCents: 0,
        });
        setSelectedSupplierPriceId("new");
        onChanged();
      },
    }),
  );
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    archiveMutation.isPending;

  useEffect(() => {
    if (!form.getValues("materialId") && materials[0]?.id) {
      form.setValue("materialId", materials[0].id);
    }
  }, [form, materials]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supplier pricing</CardTitle>
        <CardDescription>
          Track supplier-specific material costs and choose a preferred default.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values: SupplierPriceFormValues) => {
              if (selectedSupplierPriceId === "new") {
                createMutation.mutate(values);
                return;
              }

              updateMutation.mutate({
                ...values,
                id: selectedSupplierPriceId,
              });
            })}
          >
            <div className="space-y-2">
              <p className="text-sm font-medium">Supplier price record</p>
              <Select
                value={selectedSupplierPriceId}
                onValueChange={(value) => {
                  setSelectedSupplierPriceId(value);

                  if (value === "new") {
                    form.reset({
                      currency: "NGN",
                      isPreferred: false,
                      materialId: materials[0]?.id ?? "",
                      note: "",
                      notes: "",
                      supplierName: "",
                      supplierSku: "",
                      unitCostCents: 0,
                    });
                    return;
                  }

                  const price = supplierPrices.find(
                    (item) => item.id === value,
                  );
                  if (price) {
                    form.reset({
                      currency: price.currency,
                      isPreferred: price.isPreferred,
                      leadTimeDays: price.leadTimeDays ?? undefined,
                      materialId: price.materialId,
                      note: "",
                      notes: price.notes,
                      supplierName: price.supplierName,
                      supplierSku: price.supplierSku,
                      unitCostCents: price.unitCostCents,
                    });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose record" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="new">New supplier price</SelectItem>
                    {supplierPrices.map((price) => (
                      <SelectItem key={price.id} value={price.id}>
                        {price.materialName} · {price.supplierName} ·{" "}
                        {formatMoney(price.unitCostCents)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    value={field.value}
                    disabled={!materials.length}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                control={form.control}
                name="supplierName"
                label="Supplier"
              />
              <TextField
                control={form.control}
                name="supplierSku"
                label="Supplier SKU"
              />
              <CurrencyField
                control={form.control}
                name="unitCostCents"
                label="Supplier unit cost"
                cents
              />
              <NumberField
                control={form.control}
                name="leadTimeDays"
                label="Lead time days"
              />
              <TextField
                control={form.control}
                name="currency"
                label="Currency"
              />
              <FormField
                control={form.control}
                name="isPreferred"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred</FormLabel>
                    <Select
                      value={field.value ? "yes" : "no"}
                      onValueChange={(value) => field.onChange(value === "yes")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <TextField
              control={form.control}
              name="note"
              label="Pricing history note"
            />
            <LongTextField control={form.control} name="notes" label="Notes" />

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={isPending || !materials.length}>
                <RefreshCw data-icon="inline-start" />
                {isPending
                  ? "Saving..."
                  : selectedSupplierPriceId === "new"
                    ? "Add supplier price"
                    : "Update supplier price"}
              </Button>
              {selectedSupplierPriceId !== "new" ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() =>
                    archiveMutation.mutate({ id: selectedSupplierPriceId })
                  }
                >
                  Archive supplier price
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function MaterialCostUpdateForm({
  materials,
  onChanged,
}: {
  materials: Material[];
  onChanged: () => void;
}) {
  const trpc = useTRPC();
  const form = useZodForm({
    schema: updateQuotationMaterialCostSchema,
    defaultValues: {
      materialId: materials[0]?.id ?? "",
      note: "",
      supplier: "",
      unitCostCents: materials[0]?.currentUnitCostCents ?? 0,
    },
  });
  const selectedMaterialId = form.watch("materialId");
  const mutation = useMutation(
    trpc.quotations.materials.updateCost.mutationOptions({
      onSuccess: () => {
        form.reset({
          materialId: selectedMaterialId,
          note: "",
          supplier: "",
          unitCostCents: form.getValues("unitCostCents"),
        });
        onChanged();
      },
    }),
  );

  useEffect(() => {
    if (!selectedMaterialId && materials[0]?.id) {
      form.setValue("materialId", materials[0].id);
    }
  }, [form, materials, selectedMaterialId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update material cost</CardTitle>
        <CardDescription>
          Every update is recorded in the material cost history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((values: MaterialCostFormValues) =>
              mutation.mutate(values),
            )}
          >
            <FormField
              control={form.control}
              name="materialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <Select
                    value={field.value}
                    disabled={!materials.length}
                    onValueChange={(value) => {
                      field.onChange(value);
                      const material = materials.find(
                        (item) => item.id === value,
                      );
                      if (material) {
                        form.setValue(
                          "unitCostCents",
                          material.currentUnitCostCents,
                          { shouldDirty: true, shouldValidate: true },
                        );
                        form.setValue("supplier", material.supplier, {
                          shouldDirty: true,
                        });
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectGroup>
                        {materials.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CurrencyField
                control={form.control}
                name="unitCostCents"
                label="New unit cost"
                cents
              />
              <TextField
                control={form.control}
                name="supplier"
                label="Supplier"
              />
            </div>
            <TextField
              control={form.control}
              name="note"
              label="History note"
            />
            <Button
              type="submit"
              disabled={mutation.isPending || !materials.length}
            >
              <RefreshCw data-icon="inline-start" />
              {mutation.isPending ? "Updating..." : "Update cost"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function TextField({
  control,
  label,
  name,
  type = "text",
}: {
  control: any;
  label: string;
  name: any;
  type?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type={type} {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function LongTextField({
  control,
  label,
  name,
}: {
  control: any;
  label: string;
  name: any;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea {...field} value={field.value ?? ""} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function NumberField({
  control,
  label,
  name,
  step = "1",
}: {
  control: any;
  label: string;
  name: any;
  step?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min="0"
              step={step}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value === ""
                    ? undefined
                    : Number(event.target.value),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function CurrencyField({
  cents = false,
  control,
  label,
  name,
  suffix,
}: {
  cents?: boolean;
  control: any;
  label: string;
  name: any;
  suffix?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <CurrencyInput
              value={cents ? (field.value ?? 0) / 100 : (field.value ?? "")}
              suffix={suffix}
              onValueChange={(values) => {
                const value = values.floatValue ?? 0;
                field.onChange(cents ? Math.round(value * 100) : value);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function DateField({
  control,
  label,
  name,
}: {
  control: any;
  label: string;
  name: any;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="date"
              value={
                field.value instanceof Date
                  ? format(field.value, "yyyy-MM-dd")
                  : ""
              }
              onChange={(event) => {
                field.onChange(
                  event.target.value
                    ? new Date(`${event.target.value}T00:00:00`)
                    : undefined,
                );
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function Metric({
  label,
  strong,
  value,
}: {
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div className="border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          strong ? "mt-1 text-lg font-semibold" : "mt-1 text-sm font-medium"
        }
      >
        {value}
      </p>
    </div>
  );
}

function QuotationSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 w-96" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

function defaultQuotationValues(): QuotationFormValues {
  return {
    clientEmail: "",
    clientName: "",
    currency: "NGN",
    customerId: "",
    markupPercent: 20,
    notes: "",
    projectName: "",
    siteAddress: "",
    status: "draft",
    units: [emptyQuotationUnit(1)],
    validUntil: undefined,
  };
}

function emptyQuotationUnit(
  index: number,
): QuotationFormValues["units"][number] {
  return {
    heightMm: 1200,
    label: `W${index}`,
    laborCostCents: 0,
    location: "",
    materialLines: [emptyMaterialLine()],
    notes: "",
    quantity: 1,
    unitType: "window",
    widthMm: 1200,
  };
}

function emptyMaterialLine(): QuotationFormValues["units"][number]["materialLines"][number] {
  return {
    materialId: "",
    materialName: "",
    quantity: 1,
    supplierName: "",
    supplierPriceId: "",
    unit: "piece",
    unitCostCents: 0,
    wastePercent: 0,
  };
}

function calculatePreview(values: Partial<QuotationFormValues>) {
  const markupBps = Math.max(0, Math.round((values.markupPercent ?? 0) * 100));
  let materialSubtotalCents = 0;
  let laborSubtotalCents = 0;

  for (const unit of values.units ?? []) {
    const unitQuantity = Math.max(1, Number(unit.quantity ?? 1));
    laborSubtotalCents += Math.round(
      Number(unit.laborCostCents ?? 0) * unitQuantity,
    );

    for (const line of unit.materialLines ?? []) {
      const quantity = Math.max(0, Number(line.quantity ?? 0));
      const unitCostCents = Math.max(0, Number(line.unitCostCents ?? 0));
      const wasteMultiplier =
        1 + Math.max(0, Number(line.wastePercent ?? 0)) / 100;

      materialSubtotalCents += Math.round(
        quantity * unitQuantity * unitCostCents * wasteMultiplier,
      );
    }
  }

  const subtotalCents = materialSubtotalCents + laborSubtotalCents;
  const markupCents = Math.round((subtotalCents * markupBps) / 10_000);

  return {
    laborSubtotalCents,
    markupCents,
    materialSubtotalCents,
    subtotalCents,
    totalCents: subtotalCents + markupCents,
  };
}

function toQuotationStatus(value: string): QuotationStatus {
  return value in statusLabels ? (value as QuotationStatus) : "draft";
}

function formatMoney(cents: number, currency = "NGN") {
  try {
    return new Intl.NumberFormat("en-NG", {
      currency: currency || "NGN",
      style: "currency",
    }).format(cents / 100);
  } catch {
    return `${currency || "NGN"} ${(cents / 100).toLocaleString("en-NG", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }
}
