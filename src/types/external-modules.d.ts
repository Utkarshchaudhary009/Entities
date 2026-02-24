declare module "@/generated/prisma/client" {
  export const Prisma: {
    PrismaClientKnownRequestError: new (...args: any[]) => Error & {
      code: string;
      meta?: Record<string, unknown>;
    };
    PrismaClientUnknownRequestError: new (...args: any[]) => Error;
    PrismaClientValidationError: new (...args: any[]) => Error;
    PrismaClientRustPanicError: new (...args: any[]) => Error;
  };

  export namespace Prisma {
    type OrderWhereInput = Record<string, unknown>;
    type DiscountWhereInput = Record<string, unknown>;
    type ProductWhereInput = Record<string, unknown>;
    type ProductVariantUpdateInput = Record<string, unknown>;
    type DiscountUncheckedCreateInput = Record<string, unknown>;
    type DiscountUncheckedUpdateInput = Record<string, unknown>;
    type BrandDocumentWhereInput = Record<string, unknown>;
    type BrandDocumentUncheckedCreateInput = Record<string, unknown>;
    type BrandDocumentUncheckedUpdateInput = Record<string, unknown>;
    type BrandWhereInput = Record<string, unknown>;
    type BrandUncheckedCreateInput = Record<string, unknown>;
    type BrandUncheckedUpdateInput = Record<string, unknown>;
    type CategoryWhereInput = Record<string, unknown>;
    type CategoryCreateInput = Record<string, unknown>;
    type CategoryUpdateInput = Record<string, unknown>;
    type ColorCreateInput = Record<string, unknown>;
    type ColorUpdateInput = Record<string, unknown>;
    type FounderWhereInput = Record<string, unknown>;
    type FounderCreateInput = Record<string, unknown>;
    type FounderUpdateInput = Record<string, unknown>;
    type ProductOrderByWithRelationInput = Record<string, unknown>;
    type ProductCreateInput = Record<string, unknown>;
    type ProductUpdateInput = Record<string, unknown>;
    type SizeCreateInput = Record<string, unknown>;
    type SizeUpdateInput = Record<string, unknown>;
    type SocialLinkWhereInput = Record<string, unknown>;
    type SocialLinkCreateInput = Record<string, unknown>;
    type SocialLinkUpdateInput = Record<string, unknown>;
  }

  export type OrderStatus =
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";

  export type DiscountType = "PERCENTAGE" | "FIXED" | "BOGO";

  export interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface Brand {
    id: string;
    name: string;
    logoUrl?: string | null;
    tagline?: string | null;
    brandStory?: string | null;
    supportEmail?: string | null;
    supportPhone?: string | null;
    isActive?: boolean;
    founderId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface Founder {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface SocialLink {
    id: string;
    platform: string;
    url: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface BrandDocument {
    id: string;
    type: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface BrandPhilosophy {
    id: string;
    values: string[];
    createdAt: Date;
    updatedAt: Date;
  }
  export interface Color {
    id: string;
    name: string;
    hex: string;
  }
  export interface Size {
    id: string;
    label: string;
  }
  export interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number;
    categoryId?: string | null;
    thumbnailUrl?: string | null;
    isActive?: boolean;
    isFeatured?: boolean;
    compareAtPrice?: number | null;
    material?: string | null;
    fabric?: string | null;
    fit?: string | null;
    careInstruction?: string | null;
    defaultColor?: string | null;
    defaultSize?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
  export interface ProductVariant {
    id: string;
    productId: string;
    size: string;
    color: string;
    colorHex?: string | null;
    images: string[];
    stock: number;
    sku?: string | null;
  }
  export interface Order {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }
  export interface Discount {
    id: string;
    code: string;
    value: number;
    createdAt: Date;
    startsAt: Date | null;
    expiresAt: Date | null;
  }
  export interface CartItem {
    id: string;
    productVariantId: string;
    quantity: number;
  }

  export class PrismaClient {
    [key: string]: any;
    constructor(_args?: unknown);
  }
}

declare module "@/generated/prisma/enums" {
  export const DocumentType: {
    RETURN_POLICY: "RETURN_POLICY";
    SHIPPING_POLICY: "SHIPPING_POLICY";
    REFUND_POLICY: "REFUND_POLICY";
    PRIVACY_POLICY: "PRIVACY_POLICY";
    TERMS_AND_CONDITIONS: "TERMS_AND_CONDITIONS";
  };
  export type DocumentType = (typeof DocumentType)[keyof typeof DocumentType];
}

declare module "@hugeicons/core-free-icons" {
  export const Alert02Icon: any;
  export const ArrowDown01Icon: any;
  export const ArrowDownIcon: any;
  export const ArrowLeftDoubleIcon: any;
  export const ArrowLeftIcon: any;
  export const ArrowRight01Icon: any;
  export const ArrowRightDoubleIcon: any;
  export const ArrowRightIcon: any;
  export const ArrowUp01Icon: any;
  export const BluetoothIcon: any;
  export const Building06Icon: any;
  export const Cancel01Icon: any;
  export const CheckmarkCircle02Icon: any;
  export const CodeIcon: any;
  export const ComputerIcon: any;
  export const CreditCardIcon: any;
  export const DashboardSquare01Icon: any;
  export const DiscountTag01Icon: any;
  export const DownloadIcon: any;
  export const EyeIcon: any;
  export const File01Icon: any;
  export const File02Icon: any;
  export const FileIcon: any;
  export const FloppyDiskIcon: any;
  export const FolderIcon: any;
  export const FolderOpenIcon: any;
  export const HelpCircleIcon: any;
  export const InboxDownloadIcon: any;
  export const InformationCircleIcon: any;
  export const Invoice02Icon: any;
  export const KeyboardIcon: any;
  export const LanguageCircleIcon: any;
  export const LayoutIcon: any;
  export const Loading03Icon: any;
  export const LogoutIcon: any;
  export const MailIcon: any;
  export const Menu01Icon: any;
  export const MoonIcon: any;
  export const MoreHorizontalCircle01Icon: any;
  export const MoreVerticalCircle01Icon: any;
  export const MultiplicationSignCircleIcon: any;
  export const NotificationIcon: any;
  export const Package02Icon: any;
  export const PackageIcon: any;
  export const PaintBoardIcon: any;
  export const PaintBrushIcon: any;
  export const PercentCircleIcon: any;
  export const PlusSignIcon: any;
  export const RulerIcon: any;
  export const Search02Icon: any;
  export const SettingsIcon: any;
  export const Shield01Icon: any;
  export const ShieldIcon: any;
  export const ShoppingCart01Icon: any;
  export const SunIcon: any;
  export const TagsIcon: any;
  export const Tick02Icon: any;
  export const UnfoldMoreIcon: any;
  export const UserCircle02Icon: any;
  export const UserIcon: any;
  export const Wallet01Icon: any;
}

declare module "@hugeicons/react" {
  export type IconSvgElement = any;
  export const HugeiconsIcon: any;
}

declare module "radix-ui" {
  export const AlertDialog: any;
  export const Avatar: any;
  export const Dialog: any;
  export const DropdownMenu: any;
  export const Label: any;
  export const Popover: any;
  export const ScrollArea: any;
  export const Select: any;
  export const Separator: any;
  export const Slot: any;
  export const Switch: any;
  export const Tabs: any;
  export const Tooltip: any;
}

declare module "recharts" {
  export type LegendProps = any;
  export const ResponsiveContainer: any;
  export const Tooltip: any;
  export const Legend: any;
}

declare module "@base-ui/react" {
  export namespace Combobox {
    namespace Value { type Props = any }
    namespace Trigger { type Props = any }
    namespace Clear { type Props = any }
    namespace Input { type Props = any }
    namespace Popup { type Props = any }
    namespace Positioner { type Props = any }
    namespace List { type Props = any }
    namespace Item { type Props = any }
    namespace Group { type Props = any }
    namespace GroupLabel { type Props = any }
    namespace Collection { type Props = any }
    namespace Empty { type Props = any }
    namespace Separator { type Props = any }
    namespace Chips { type Props = any }
    namespace Chip { type Props = any }
    const Root: any;
    const Value: any;
    const Trigger: any;
    const Clear: any;
    const Input: any;
    const Popup: any;
    const Positioner: any;
    const Portal: any;
    const List: any;
    const Item: any;
    const ItemIndicator: any;
    const Group: any;
    const GroupLabel: any;
    const Collection: any;
    const Empty: any;
    const Separator: any;
    const Chips: any;
    const Chip: any;
    const ChipRemove: any;
  }
  export const Combobox: typeof Combobox;
}

declare module "react-day-picker" {
  export type DayButton = any;
  export type Locale = any;
  export const DayButton: any;
  export const DayPicker: any;
  export const getDefaultClassNames: any;
}

declare module "inngest/next" { export const serve: any; }

declare module "inngest" {
  export class EventSchemas { fromRecord<T>(): T; }
  export class Inngest {
    constructor(_args?: unknown);
    createFunction: any;
    send: any;
  }
}

declare module "prisma/config" { export const defineConfig: any; }
declare module "cmdk" { export const Command: any; }
declare module "@prisma/adapter-pg" { export class PrismaPg { constructor(_pool: unknown); } }
declare module "pg" { export class Pool { constructor(_args?: unknown); } }
declare module "bun:test";
