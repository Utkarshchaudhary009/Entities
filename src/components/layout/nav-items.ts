import {
  Home01Icon,
  ShoppingCart01Icon,
  Store01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

export const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home01Icon },
  { href: "/shop", label: "Shop", icon: Store01Icon },
  { href: "/cart", label: "Cart", icon: ShoppingCart01Icon },
  { href: "/profile", label: "Profile", icon: UserIcon },
] as const;
