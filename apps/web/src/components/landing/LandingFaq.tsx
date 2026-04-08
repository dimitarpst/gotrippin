"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import type { LandingFaqCopy } from "@/i18n/getLandingFaq"

export default function LandingFaq({ title, items }: LandingFaqCopy) {
  return (
    <section id="faq" className="scroll-mt-24 border-t border-border px-6 py-24 dark:border-white/10">
      <div className="mx-auto max-w-2xl">
        <h2 className="font-display mb-10 text-center text-3xl font-bold tracking-tight text-foreground sm:text-4xl dark:text-white">
          {title}
        </h2>
        <Accordion type="single" collapsible className="w-full rounded-xl border border-border bg-card px-2 dark:border-white/10 dark:bg-white/[0.03]">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`faq-${index}`} className="border-border px-2 dark:border-white/10">
              <AccordionTrigger className="text-left text-base font-medium hover:no-underline dark:text-white">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 pt-0 leading-relaxed dark:text-white/65">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
