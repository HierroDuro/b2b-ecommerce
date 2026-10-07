"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload, X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { productSchema, type ProductInput } from "@/lib/validations/product.schema";
import { createProduct, updateProduct } from "@/actions/product-actions";
import { cn } from "@/lib/utils";
import type { CategoryDTO, ProductDTO } from "@/types/product";

interface ProductFormProps {
  categories: CategoryDTO[];
  product?: ProductDTO;
  /** Brands already in use, offered as suggestions in the "Marca" field. */
  brands?: string[];
}

const MAX_GALLERY_IMAGES = 8;

export function ProductForm({ categories, product, brands = [] }: ProductFormProps) {
  const router = useRouter();
  const [uploadingCover, setUploadingCover] = React.useState(false);
  const [uploadingGallery, setUploadingGallery] = React.useState(false);
  const [isDraggingGallery, setIsDraggingGallery] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? {
          sku: product.sku,
          name: product.name,
          description: product.description,
          brand: product.brand,
          price: product.price,
          originalPrice: product.originalPrice ?? null,
          isOnSale: product.isOnSale,
          showInBanner: product.showInBanner,
          stock: product.stock,
          imageUrl: product.imageUrl,
          images: product.images,
          optionName: product.optionName,
          variants: (product.variants ?? []).map((v) => ({ label: v.label, price: v.price })),
          categoryId: product.categoryId,
          isFeatured: product.isFeatured,
          isActive: product.isActive,
        }
      : {
          isFeatured: false,
          isActive: true,
          isOnSale: false,
          showInBanner: true,
          originalPrice: null,
          stock: 0,
          images: [],
          optionName: "Color",
          variants: [],
        },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const imageUrl = watch("imageUrl");
  const images = watch("images") ?? [];
  const isOnSale = watch("isOnSale");

  const onSubmit = async (values: ProductInput) => {
    const result = product
      ? await updateProduct(product.id, values)
      : await createProduct(values);

    if (!result.success) {
      toast.error(result.message);
      return;
    }

    toast.success(result.message);
    router.push("/admin/products");
    router.refresh();
  };

  /** Uploads a file to /api/upload and returns its public URL, or null on failure. */
  const uploadImage = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "No se pudo subir la imagen");
      return null;
    }
    return data.url as string;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const url = await uploadImage(file);
      if (url) setValue("imageUrl", url, { shouldValidate: true });
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  /** Uploads as many of the given files as fit under MAX_GALLERY_IMAGES, in parallel. */
  const handleGalleryFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;

    const remainingSlots = MAX_GALLERY_IMAGES - images.length;
    if (remainingSlots <= 0) {
      toast.error(`Ya alcanzaste el máximo de ${MAX_GALLERY_IMAGES} imágenes.`);
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > filesToUpload.length) {
      toast(`Se subirán ${filesToUpload.length} de ${files.length} imágenes (máximo ${MAX_GALLERY_IMAGES}).`);
    }

    setUploadingGallery(true);
    try {
      const uploaded = await Promise.all(filesToUpload.map(uploadImage));
      const successUrls = uploaded.filter((url): url is string => Boolean(url));
      if (successUrls.length > 0) {
        setValue("images", [...images, ...successUrls], { shouldValidate: true });
      }
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) await handleGalleryFiles(e.target.files);
    e.target.value = "";
  };

  const handleGalleryDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingGallery(false);
    if (e.dataTransfer.files?.length) await handleGalleryFiles(e.dataTransfer.files);
  };

  const removeGalleryImage = (index: number) => {
    setValue(
      "images",
      images.filter((_, i) => i !== index),
      { shouldValidate: true },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="sku">SKU</Label>
          <Input id="sku" {...register("sku")} />
          {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca</Label>
          <Input id="brand" list="brand-suggestions" autoComplete="off" {...register("brand")} />
          <datalist id="brand-suggestions">
            {brands.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <p className="text-xs text-muted-foreground">
            Elegí una marca de la lista para no duplicarla. Si ya existe, se guarda con su
            escritura original aunque cambien las mayúsculas.
          </p>
          {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Nombre</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea id="description" rows={4} {...register("description")} />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Categoría</Label>
        <Controller
          control={control}
          name="categoryId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Elegí una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.categoryId && (
          <p className="text-xs text-destructive">{errors.categoryId.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="price">Precio</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input id="price" type="number" step="0.01" className="pl-7" {...register("price")} />
          </div>
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="stock">Stock</Label>
          <Input id="stock" type="number" {...register("stock")} />
          {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
        </div>
      </div>

      {isOnSale && (
        <div className="space-y-1.5">
          <Label htmlFor="originalPrice">Precio original</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="originalPrice"
              type="number"
              step="0.01"
              className="pl-7"
              placeholder="Precio de lista antes del descuento"
              {...register("originalPrice")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Opcional. Si lo cargás, el catálogo lo muestra tachado junto al precio actual. Dejalo
            vacío para mostrar solo la insignia &quot;Oferta&quot; sin precio tachado.
          </p>
          {errors.originalPrice && (
            <p className="text-xs text-destructive">{errors.originalPrice.message}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Imagen del producto</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted/40">
            {imageUrl ? (
              <Image src={imageUrl} alt="Vista previa" fill className="object-contain p-2" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Upload className="h-5 w-5" />
              </div>
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadingCover}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir imagen"}
            </Button>
            {errors.imageUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.imageUrl.message}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Galería de imágenes</Label>
        <p className="text-xs text-muted-foreground">
          Imágenes adicionales que el cliente puede recorrer en la tarjeta del catálogo, además de
          la imagen de portada. Podés seleccionar varias a la vez o arrastrarlas y soltarlas acá.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (images.length < MAX_GALLERY_IMAGES) setIsDraggingGallery(true);
          }}
          onDragLeave={() => setIsDraggingGallery(false)}
          onDrop={handleGalleryDrop}
          className={cn(
            "flex flex-wrap gap-3 rounded-lg p-2 pt-1 transition-colors",
            isDraggingGallery && images.length < MAX_GALLERY_IMAGES
              ? "bg-primary/5 ring-2 ring-primary/40"
              : "ring-2 ring-transparent",
          )}
        >
          {images.map((url, index) => (
            <div
              key={url + index}
              className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted/40"
            >
              <Image src={url} alt={`Imagen ${index + 1}`} fill className="object-contain p-2" />
              <button
                type="button"
                onClick={() => removeGalleryImage(index)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Quitar imagen ${index + 1}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {images.length < MAX_GALLERY_IMAGES && (
            <>
              <input
                ref={galleryInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleGalleryUpload}
              />
              <button
                type="button"
                disabled={uploadingGallery}
                onClick={() => galleryInputRef.current?.click()}
                className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
                aria-label="Agregar imágenes a la galería"
              >
                {uploadingGallery ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>
            </>
          )}
        </div>
        {errors.images && <p className="text-xs text-destructive">{errors.images.message}</p>}
      </div>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="space-y-0.5">
          <Label>Variantes (opcional)</Label>
          <p className="text-xs text-muted-foreground">
            Para el mismo producto en distintos colores (o capacidades): en la página del
            producto el cliente elige una opción. Si dejás el precio vacío, usa el del producto.
          </p>
        </div>
        {variantFields.length > 0 && (
          <div className="space-y-1.5">
            <Label htmlFor="optionName" className="text-xs">
              Título del selector
            </Label>
            <Input id="optionName" className="max-w-[12rem]" placeholder="Color" {...register("optionName")} />
          </div>
        )}
        {variantFields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Ej: Blanco"
                aria-label={`Nombre de la variante ${index + 1}`}
                {...register(`variants.${index}.label` as const)}
              />
              {errors.variants?.[index]?.label && (
                <p className="text-xs text-destructive">{errors.variants[index]?.label?.message}</p>
              )}
            </div>
            <div className="w-40 space-y-1">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  placeholder="Opcional"
                  aria-label={`Precio de la variante ${index + 1}`}
                  {...register(`variants.${index}.price` as const)}
                />
              </div>
              {errors.variants?.[index]?.price && (
                <p className="text-xs text-destructive">{errors.variants[index]?.price?.message}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeVariant(index)}
              aria-label={`Quitar variante ${index + 1}`}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => appendVariant({ label: "", price: null })}
        >
          <Plus className="h-4 w-4" />
          Agregar variante
        </Button>
      </div>

      <div className="divide-y divide-border rounded-lg border border-border">
        <Controller
          control={control}
          name="isFeatured"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isFeatured" className="cursor-pointer">
                  Destacado
                </Label>
                <p className="text-xs text-muted-foreground">
                  Muestra la insignia &quot;Destacado&quot; en la tarjeta del catálogo.
                </p>
              </div>
              <Switch id="isFeatured" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        <Controller
          control={control}
          name="isOnSale"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isOnSale" className="cursor-pointer">
                  En oferta
                </Label>
                <p className="text-xs text-muted-foreground">
                  Muestra la insignia &quot;Oferta&quot; en la tarjeta del catálogo.
                </p>
              </div>
              <Switch id="isOnSale" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
        {isOnSale && (
          <Controller
            control={control}
            name="showInBanner"
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 bg-muted/30 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="showInBanner" className="cursor-pointer">
                    Mostrar en el banner corredizo
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Incluye este producto en la franja de ofertas que se desliza sola arriba de
                    la home. No afecta la sección &quot;Ofertas&quot; del catálogo, que siempre
                    muestra todos los productos en oferta.
                  </p>
                </div>
                <Switch id="showInBanner" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />
        )}
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive" className="cursor-pointer">
                  Activo
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si está apagado, el producto se oculta del catálogo público (sigue existiendo acá).
                </p>
              </div>
              <Switch id="isActive" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : product ? (
            "Guardar cambios"
          ) : (
            "Crear producto"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
