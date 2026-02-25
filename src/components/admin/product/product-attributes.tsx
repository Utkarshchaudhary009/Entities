import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface ProductAttributesProps {
  material: string;
  fabric: string;
  fit: string;
  careInstruction: string;
  defaultColor: string;
  defaultSize: string;
  isFeatured: boolean;
  isActive: boolean;
  onChange: (
    field:
      | "material"
      | "fabric"
      | "fit"
      | "careInstruction"
      | "defaultColor"
      | "defaultSize"
      | "isFeatured"
      | "isActive",
    value: string | boolean,
  ) => void;
}

export function ProductAttributes({
  material,
  fabric,
  fit,
  careInstruction,
  defaultColor,
  defaultSize,
  isFeatured,
  isActive,
  onChange,
}: ProductAttributesProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={material}
            onChange={(e) => onChange("material", e.target.value)}
            placeholder="Cotton"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fabric">Fabric</Label>
          <Input
            id="fabric"
            value={fabric}
            onChange={(e) => onChange("fabric", e.target.value)}
            placeholder="Denim"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fit">Fit</Label>
          <Input
            id="fit"
            value={fit}
            onChange={(e) => onChange("fit", e.target.value)}
            placeholder="Regular"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="careInstruction">Care Instruction</Label>
          <Input
            id="careInstruction"
            value={careInstruction}
            onChange={(e) => onChange("careInstruction", e.target.value)}
            placeholder="Machine wash"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="defaultColor">Default Color</Label>
          <Input
            id="defaultColor"
            value={defaultColor}
            onChange={(e) => onChange("defaultColor", e.target.value)}
            placeholder="Black"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="defaultSize">Default Size</Label>
          <Input
            id="defaultSize"
            value={defaultSize}
            onChange={(e) => onChange("defaultSize", e.target.value)}
            placeholder="M"
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="isFeatured" className="cursor-pointer">
          Featured Product
        </Label>
        <Switch
          id="isFeatured"
          checked={isFeatured}
          onCheckedChange={(checked) => onChange("isFeatured", checked)}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label htmlFor="isActive" className="cursor-pointer">
          Active
        </Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => onChange("isActive", checked)}
        />
      </div>
    </>
  );
}
