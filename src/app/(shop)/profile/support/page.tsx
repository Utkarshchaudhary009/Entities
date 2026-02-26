"use client";

import {
  ArrowLeft01Icon,
  Mail01Icon,
  WhatsappIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const FAQS = [
  {
    question: "How long does delivery take?",
    answer:
      "Standard delivery typically takes 3-5 business days depending on your location.",
  },
  {
    question: "Can I return an item?",
    answer:
      "Yes, we offer a 14-day return policy for unused items in their original packaging.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Once your order ships, you will receive a tracking link via email and SMS.",
  },
];

export default function SupportPage() {
  return (
    <div className="flex flex-col h-full bg-card min-h-[500px]">
      <div className="flex items-center p-4 border-b">
        <Button variant="ghost" size="icon" asChild className="-ml-2 mr-2">
          <Link href="/profile">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
          </Link>
        </Button>
        <h2 className="text-lg font-semibold">Help & Support</h2>
      </div>

      <div className="p-4 space-y-6">
        <section>
          <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
          <div className="space-y-3">
            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              asChild
            >
              <a
                href="https://wa.me/1234567890"
                target="_blank"
                rel="noopener noreferrer"
              >
                <HugeiconsIcon
                  icon={WhatsappIcon}
                  className="size-5 text-green-500"
                />
                Chat on WhatsApp
              </a>
            </Button>
            <Button
              className="w-full justify-start gap-3"
              variant="outline"
              asChild
            >
              <a href="mailto:support@entities.com">
                <HugeiconsIcon icon={Mail01Icon} className="size-5" />
                Email Support
              </a>
            </Button>
          </div>
        </section>

        <section>
          <h3 className="font-semibold text-lg mb-4">
            Frequently Asked Questions
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((faq, index) => (
              <AccordionItem key={faq.question} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
}
