import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Category {
    id: string;
    name: string;
}

interface ProductPricingProps {
    price: string;
    compareAtPrice: string;
    categoryId: string;
    categories: Category[];
    errors: Record<string, string>;
    onChange: (field: "price" | "compareAtPrice" | "categoryId", value: string) => void;
}

export function ProductPricing({
    price,
    compareAtPrice,
    categoryId,
    categories,
    errors,
    onChange,
}: ProductPricingProps) {
    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <Label htmlFor="price">Price (cents) *</Label>
                    <Input
                        id="price"
                        type="number"
                        value={price}
                        onChange={(e) => onChange("price", e.target.value)}
                        placeholder="1000"
                        aria-invalid={!!errors.price}
                    />
                    {errors.price && <p className="text-destructive text-xs">{errors.price}</p>}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="compareAtPrice">Compare At Price</Label>
                    <Input
                        id="compareAtPrice"
                        type="number"
                        value={compareAtPrice}
                        onChange={(e) => onChange("compareAtPrice", e.target.value)}
                        placeholder="1500"
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label htmlFor="categoryId">Category</Label>
                <Select value={categoryId} onValueChange={(value) => onChange("categoryId", value)}>
                    <SelectTrigger id="categoryId" className="w-full">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.categoryId && <p className="text-destructive text-xs">{errors.categoryId}</p>}
            </div>
        </>
    );
}
