"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/lib/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().regex(/^\d+$/, "Phone must be numeric").min(10, "Invalid phone number"),
    addressLine1: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    postalCode: z.string().min(5, "Zip code is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CheckoutDialogProps {
    product: {
        id: string;
        name: string;
        price: number;
    };
    trigger?: React.ReactNode;
}

export default function CheckoutDialog({ product, trigger }: CheckoutDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { user } = useUser();
    const supabase = useSupabase();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            phone: "",
            addressLine1: "",
            city: "",
            state: "",
            postalCode: "",
        },
    });

    // Fetch last saved address
    useEffect(() => {
        async function fetchAddress() {
            if (!user) return;

            const { data, error } = await supabase
                .from("shipping_addresses")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(1)
                .single();

            if (data && !error) {
                form.reset({
                    name: data.name || user.fullName || "",
                    phone: data.phone || "",
                    addressLine1: data.address_line1 || "",
                    city: data.city || "",
                    state: data.state || "",
                    postalCode: data.postal_code || "",
                });
            } else if (user.fullName) {
                form.setValue("name", user.fullName);
            }
        }

        if (open) fetchAddress();
    }, [open, user, supabase, form]);

    async function onSubmit(values: FormValues) {
        if (!user) {
            toast.error("Please sign in to place an order");
            return;
        }

        setLoading(true);
        try {
            // 1. Upsert address
            const { error: addressError } = await supabase.from("shipping_addresses").upsert({
                user_id: user.id,
                name: values.name,
                address_line1: values.addressLine1,
                city: values.city,
                state: values.state,
                postal_code: values.postalCode,
                phone: values.phone,
                country: "India", // Defaulting to India
            }, { onConflict: 'user_id, address_line1' }); // Minimal conflict check or just use standard insert if preferred

            if (addressError) throw addressError;

            // 2. Create order
            const { data: order, error: orderError } = await supabase.from("orders").insert({
                user_id: user.id,
                status: "pending",
                total_amount: product.price,
                shipping_address: values,
                billing_address: values, // Using same for now
            }).select().single();

            if (orderError) throw orderError;

            // 3. Create order item
            const { error: itemError } = await supabase.from("order_items").insert({
                order_id: order.id,
                product_id: product.id,
                quantity: 1,
                price: product.price,
            });

            if (itemError) throw itemError;

            // 4. WhatsApp Redirect
            const whatsappNumber = "919876543210"; // Placeholder, usually from env
            const message = `Order #${order.id.slice(0, 8)}: I want to buy ${product.name} (Amount: ₹${product.price}).\n\nShipping Details:\n${values.name}\n${values.phone}\n${values.addressLine1}, ${values.city}, ${values.state} - ${values.postalCode}`;
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

            toast.success("Order initiated! Redirecting to WhatsApp...");

            setTimeout(() => {
                window.open(whatsappUrl, "_blank");
                setOpen(false);
                setLoading(false);
            }, 1500);

        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to process order");
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button size="lg" className="w-full">Buy Now</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Shipping Details</DialogTitle>
                    <DialogDescription>
                        Enter your delivery information to complete the order via WhatsApp.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="John Doe" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="9876543210" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addressLine1"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Address</FormLabel>
                                    <FormControl>
                                        <Input placeholder="House No, Street, Area" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                            <Input placeholder="City" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="state"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>State</FormLabel>
                                        <FormControl>
                                            <Input placeholder="State" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Zip Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="123456" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Complete Order
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
