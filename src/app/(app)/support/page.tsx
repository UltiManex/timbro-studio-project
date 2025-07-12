
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, BookOpen, MessageSquare, Search } from "lucide-react";
import Link from "next/link";

const faqItems = [
  {
    value: "faq-1",
    question: "What audio file formats does Timbro support?",
    answer: "Timbro supports MP3, WAV, and M4A audio file formats for upload.",
  },
  {
    value: "faq-2",
    question: "What are the limitations of the Free Trial?",
    answer: "The Free Trial includes 30 minutes of audio processing or lasts for 7 days, whichever comes first. Some advanced features and export options may be limited.",
  },
  {
    value: "faq-3",
    question: "How does the AI suggest sound effects?",
    answer: "Timbro's AI analyzes your audio content and the selected tone (Comedic, Dramatic, etc.) to intelligently suggest relevant sound effects from our library.",
  },
  {
    value: "faq-4",
    question: "Can I change or remove AI-suggested effects?",
    answer: "Yes! The interactive editor allows you to preview, swap, nudge (fine-tune timing), or delete any AI suggestion. You can also add your own effects.",
  },
  {
    value: "faq-5",
    question: "How does auto-ducking work?",
    answer: "When you export your final audio, Timbro automatically lowers the volume of your original speech track slightly during sound effects to ensure clarity and a professional sound.",
  },
];

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <LifeBuoy className="h-16 w-16 text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-bold font-headline">Help & Support</h1>
        <p className="text-muted-foreground text-lg mt-2">We're here to help you get the most out of Timbro.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center font-headline"><Search className="mr-2 h-5 w-5"/> Search Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent>
          <Input placeholder="Type your question here (e.g., 'how to export')" className="text-base py-3"/>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center font-headline"><BookOpen className="mr-2 h-5 w-5 text-primary"/> Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.slice(0,3).map(item => ( // Show first 3 for brevity
                <AccordionItem value={item.value} key={item.value}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>{item.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            {faqItems.length > 3 && <Link href="#faq-section" className="text-sm text-primary hover:underline mt-3 block">See all FAQs</Link>}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center font-headline"><MessageSquare className="mr-2 h-5 w-5 text-primary"/> Contact Support</CardTitle>
            <CardDescription>Can't find an answer? Get in touch with our support team.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="supportSubject">Subject</Label>
              <Input id="supportSubject" placeholder="e.g., Issue with audio export" />
            </div>
            <div>
              <Label htmlFor="supportMessage">Message</Label>
              <Textarea id="supportMessage" placeholder="Please describe your issue in detail..." rows={4} />
            </div>
            <Button className="w-full">Send Message</Button>
          </CardContent>
        </Card>
      </div>

      <section id="faq-section" className="mb-8">
        <h2 className="text-2xl font-semibold font-headline mb-4">All Frequently Asked Questions</h2>
        <Card>
            <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                {faqItems.map(item => (
                    <AccordionItem value={item.value} key={item.value}>
                    <AccordionTrigger>{item.question}</AccordionTrigger>
                    <AccordionContent>{item.answer}</AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </CardContent>
        </Card>
      </section>

      <div className="text-center text-sm text-muted-foreground">
        <p>For urgent issues or enterprise support, please refer to your service agreement or contact your account manager.</p>
      </div>
    </div>
  );
}
