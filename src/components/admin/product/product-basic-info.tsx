import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ProductBasicInfoProps {
    name: string;
    slug: string;
    description: string;
    errors: Record<string, string>;
    onChange: (field: "name" | "slug" | "description", value: string) => void;
}

export function ProductBasicInfo({ name, slug, description, errors, onChange }: ProductBasicInfoProps) {
    return (
        <>
            <div className="space-y-1.5">
                <Label htmlFor="name">Name *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onChange("name", e.target.value)}
                    placeholder="Product name"
                    aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => onChange("slug", e.target.value)}
                    placeholder="product-slug"
                    aria-invalid={!!errors.slug}
                />
                {errors.slug && <p className="text-destructive text-xs">{errors.slug}</p>}
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onChange("description", e.target.value)}
                    placeholder="Product description"
                />
            </div>
        </>
    );
}
