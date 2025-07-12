
'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, BadgePercent, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free Trial",
    price: "$0",
    duration: "/ 7 days or 30 mins",
    features: [
      "30 minutes of audio processing",
      "AI Sound Effect Suggestions",
      "Interactive Editor",
      "Standard MP3 Export",
      "Limited Sound Library Access",
    ],
    isCurrent: true,
    cta: "You are on the Free Trial",
    ctaDisabled: true,
  },
  {
    name: "Creator",
    price: "$19",
    duration: "/ month",
    features: [
      "10 hours of audio processing",
      "All Free Trial features, plus:",
      "Full Sound Library Access",
      "High Quality MP3 Export",
      "Email Support",
    ],
    isCurrent: false,
    cta: "Upgrade to Creator",
    popular: true,
  },
  {
    name: "Pro Studio",
    price: "$49",
    duration: "/ month",
    features: [
      "30 hours of audio processing",
      "All Creator features, plus:",
      "WAV Export Option",
      "Batch Processing (Soon)",
      "Priority Support",
    ],
    isCurrent: false,
    cta: "Upgrade to Pro Studio",
  },
];


export default function BillingPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline">Subscription & Billing</h1>
        <p className="text-muted-foreground text-lg mt-2">Choose the plan that's right for your creative needs.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        {plans.map((plan) => (
          <Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary shadow-primary/20 shadow-lg' : ''}`}>
            <CardHeader className="pb-4">
              {plan.popular && (
                <div className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs text-primary font-semibold mb-2 self-start">
                  Most Popular
                </div>
              )}
              <CardTitle className="text-2xl font-semibold font-headline">{plan.name}</CardTitle>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground ml-1">{plan.duration}</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" disabled={plan.isCurrent || plan.ctaDisabled} size="lg">
                {plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="mt-10">
        <CardHeader>
          <CardTitle className="font-headline">Current Usage</CardTitle>
          <CardDescription>Overview of your current plan's usage.</CardDescription>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold">Free Trial</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Processing Minutes Used</p>
            <p className="text-lg font-semibold">15 / 30 minutes</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Trial Ends</p>
            <p className="text-lg font-semibold">In 5 days</p> {/* Calculate this dynamically */}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Payment Method</p>
            <p className="text-lg font-semibold">N/A (Trial)</p>
            {/* <Link href="#" className="text-sm text-primary hover:underline">Update Payment Method</Link> */}
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
            <CardTitle className="font-headline">Billing History</CardTitle>
            <CardDescription>View your past invoices and payments.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">No billing history yet for your trial account.</p>
            {/* In a real app, this would be a table of invoices */}
        </CardContent>
      </Card>

      <div className="mt-10 text-center">
        <p className="text-muted-foreground">Need more power or have custom requirements?</p>
        <Button variant="link" asChild className="text-primary">
            <Link href="/support?topic=enterprise">Contact Sales</Link>
        </Button>
      </div>
    </div>
  );
}
