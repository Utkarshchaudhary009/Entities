"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckmarkCircle02Icon,
  Loading03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type * as z from "zod";
import { SocialLinksEditor } from "@/components/admin/social-links-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { createBrandSchema } from "@/lib/validations/brand";
import { useBrandStore } from "@/stores/brand.store";
import { fetchApi } from "@/stores/http";
import type { ApiBrand } from "@/types/api";

type BrandFormValues = z.input<typeof createBrandSchema>;

export default function AdminBrandPage() {
  const { brand, socialLinks, isLoading, fetchBrandDetails, updateBrand } =
    useBrandStore();
  const [initLoading, setInitLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // We need to fetch the first brand to load its details into the store
  useEffect(() => {
    async function loadInitialBrand() {
      try {
        const response = await fetchApi<{ data: ApiBrand[] }>(
          "/api/brands?limit=1",
        );
        if (response.data?.length > 0) {
          const firstBrandId = response.data[0].id;
          await fetchBrandDetails(firstBrandId);
        }
      } catch (error) {
        console.error("Failed to load initial brand", error);
        toast.error("Could not load brand details");
      } finally {
        setInitLoading(false);
      }
    }
    loadInitialBrand();
  }, [fetchBrandDetails]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(createBrandSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      tagline: "",
      brandStory: "",
      supportEmail: "",
      supportPhone: "",
      isActive: true,
      founderId: "",
    },
  });

  const isActive = watch("isActive");

  useEffect(() => {
    if (brand) {
      reset({
        name: brand.name,
        logoUrl: brand.logoUrl || "",
        tagline: brand.tagline || "",
        brandStory: brand.brandStory || "",
        supportEmail: brand.supportEmail || "",
        supportPhone: brand.supportPhone || "",
        isActive: brand.isActive,
        founderId: brand.founderId,
      });
    }
  }, [brand, reset]);

  const onSubmit = async (data: BrandFormValues) => {
    if (!brand?.id) return;
    setIsSaving(true);
    try {
      await updateBrand(brand.id, data);
      toast.success("Brand profile updated");
      reset(data); // reset isDirty state
    } catch (error) {
      console.error("Brand update error", error);
      toast.error("Failed to update brand profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (initLoading || isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <HugeiconsIcon
          icon={Loading03Icon}
          className="size-8 animate-spin text-muted-foreground"
        />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-12 text-center text-muted-foreground">
        <p>No brand configuration found.</p>
        <Button
          onClick={() =>
            toast.info("You need database seed for a default brand.")
          }
        >
          Create Brand
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Brand Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your main brand profile, story, and social links.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Profile Form */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">General Information</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input id="tagline" {...register("tagline")} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("logoUrl")}
                />
                {errors.logoUrl && (
                  <p className="text-xs text-destructive">
                    {errors.logoUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandStory">Brand Story</Label>
                <Textarea
                  id="brandStory"
                  {...register("brandStory")}
                  className="h-32"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input
                    id="supportEmail"
                    type="email"
                    {...register("supportEmail")}
                  />
                  {errors.supportEmail && (
                    <p className="text-xs text-destructive">
                      {errors.supportEmail.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    type="tel"
                    {...register("supportPhone")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Is the brand currently active?
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) =>
                    setValue("isActive", checked, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSaving || !isDirty}
                  className="min-w-[140px] gap-2"
                >
                  {isSaving ? (
                    <HugeiconsIcon
                      icon={Loading03Icon}
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="size-4"
                    />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </section>

          {/* Social Links Sub-section */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Social Links</h2>
            <SocialLinksEditor
              entityId={brand.id}
              entityType="brand"
              initialLinks={socialLinks}
            />
          </section>
        </div>

        {/* Sidebar details block */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="mb-3 font-semibold">Store Context</h3>
            <p className="text-sm text-muted-foreground">
              These details are publicly visible on storefront footers and about
              pages. Ensure logo links are resolving correctly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
