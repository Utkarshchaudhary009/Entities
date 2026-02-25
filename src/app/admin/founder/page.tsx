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
import { Textarea } from "@/components/ui/textarea";
import { createFounderSchema } from "@/lib/validations/founder";
import { useBrandStore } from "@/stores/brand.store";
import { fetchApi } from "@/stores/http";
import type { ApiBrand } from "@/types/api";

type FounderFormValues = z.input<typeof createFounderSchema>;

export default function AdminFounderPage() {
  const { founder, isLoading, fetchBrandDetails } = useBrandStore();
  const [initLoading, setInitLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Filter out only social links that belong to the founder (if the store mixes them or if the API returns mixed)
  // Usually the brand.store.ts returns `data.socialLinks` ... Oh wait, the `brandService` fetches brand's socialLinks.
  // Founder's social links might not be in the brand store directly unless deeply populated.
  // The service actually includes founder but does NOT include founder social links!
  // Wait, let's look at `brand.service.ts`... No, founder social links are not fetched in Brand Details!
  // So we need to fetch them from our `/api/social-links` route manually here.
  const [founderSocialLinks, setFounderSocialLinks] = useState<
    { id: string; platform: string; url: string }[]
  >([]);

  // We need to fetch the first brand to load its founder into the store
  useEffect(() => {
    async function loadFounder() {
      try {
        const response = await fetchApi<{ data: ApiBrand[] }>(
          "/api/brands?limit=1",
        );
        if (response.data?.length > 0) {
          const firstBrandId = response.data[0].id;
          await fetchBrandDetails(firstBrandId);
        }
      } catch (error) {
        console.error("Failed to load brand/founder", error);
        toast.error("Could not load founder details");
      } finally {
        setInitLoading(false);
      }
    }
    loadFounder();
  }, [fetchBrandDetails]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FounderFormValues>({
    resolver: zodResolver(createFounderSchema),
    defaultValues: {
      name: "",
      age: 0,
      story: "",
      education: "",
      quote: "",
      thumbnailUrl: "",
    },
  });

  useEffect(() => {
    if (founder) {
      reset({
        name: founder.name,
        age: founder.age || undefined,
        story: founder.story || "",
        education: founder.education || "",
        quote: founder.quote || "",
        thumbnailUrl: founder.thumbnailUrl || "",
      });

      fetchApi<{ data: { id: string; platform: string; url: string }[] }>(
        `/api/social-links?founderId=${founder.id}`,
      )
        .then((res) => {
          // Depending on API response shape. Assuming { data: [] }
          if (res?.data) {
            setFounderSocialLinks(res.data);
          }
        })
        .catch(console.error);
    }
  }, [founder, reset]);

  const onSubmit = async (data: FounderFormValues) => {
    if (!founder?.id) return;
    setIsSaving(true);
    try {
      await fetchApi(`/api/founders/${founder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast.success("Founder profile updated");
      reset(data); // reset isDirty state
    } catch (error) {
      console.error("Founder update error", error);
      toast.error("Failed to update founder profile");
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

  if (!founder) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-12 text-center text-muted-foreground">
        <p>No founder profile found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Founder Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage the public profile and story of the brand's founder.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          {/* Profile Form */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">Founder Details</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="0"
                    {...register("age", { valueAsNumber: true })}
                  />
                  {errors.age && (
                    <p className="text-xs text-destructive">
                      {errors.age.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnailUrl">Profile Photo URL</Label>
                <Input
                  id="thumbnailUrl"
                  type="url"
                  placeholder="https://..."
                  {...register("thumbnailUrl")}
                />
                {errors.thumbnailUrl && (
                  <p className="text-xs text-destructive">
                    {errors.thumbnailUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="story">Founder Story</Label>
                <Textarea id="story" {...register("story")} className="h-32" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    placeholder="e.g. B.Tech, Stanford"
                    {...register("education")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quote">Personal Quote</Label>
                  <Input
                    id="quote"
                    placeholder="e.g. Think different."
                    {...register("quote")}
                  />
                </div>
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
            <h2 className="mb-4 text-lg font-semibold">Founder Social Links</h2>
            <SocialLinksEditor
              entityId={founder.id}
              entityType="founder"
              initialLinks={founderSocialLinks}
            />
          </section>
        </div>

        {/* Sidebar details block */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-5">
            <h3 className="mb-3 font-semibold">About Page Context</h3>
            <p className="text-sm text-muted-foreground">
              This information is highlighted on the 'About Us' storefront page.
              Ensure the story is compelling and the photo link works.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
