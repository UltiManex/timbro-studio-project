import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaygroundDemo } from '@/components/playground-demo';
import { Logo, MagicWandIcon } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center justify-center" prefetch={false}>
          <Logo className="h-6 w-auto" />
          <span className="sr-only">Timbro</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary underline-offset-4 hover:underline"
            prefetch={false}
          >
            Features
          </Link>
          <Link
            href="#playground"
            className="text-sm font-medium hover:text-primary underline-offset-4 hover:underline"
            prefetch={false}
          >
            Playground
          </Link>
          <Link
            href="/auth/login"
            className="text-sm font-medium hover:text-primary underline-offset-4 hover:underline"
            prefetch={false}
          >
            Login
          </Link>
          <Button asChild>
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary/70">
                    Your Podcast's Missing Magic.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Sound like a professional studio in a fraction of the time. Timbro's AI finds the perfect moment for every sound effect, automatically.
                  </p>
                  <p className="text-xl font-semibold text-accent">Timbro: Instant Audio Drama.</p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/auth/signup">
                      Start Free Trial
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#playground">
                      Try the Playground
                      <MagicWandIcon className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <img
                src="https://placehold.co/600x400.png"
                data-ai-hint="podcast microphone audio"
                width="600"
                height="400"
                alt="Hero"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last lg:aspect-square shadow-xl"
              />
            </div>
          </div>
        </section>
        
        <PlaygroundDemo />

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm text-primary font-medium">Key Features</div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Everything You Need for Pro Sound</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Timbro automates the tedious parts of audio post-production, letting you focus on creativity.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="grid gap-1 text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <MagicWandIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold font-headline">AI-Powered Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligent analysis provides context-aware sound effect recommendations based on your chosen tone.
                </p>
              </div>
              <div className="grid gap-1 text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                </div>
                <h3 className="text-xl font-bold font-headline">Interactive Editor</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize your audio with a synchronized waveform and transcript. Easily review, modify, and add effects.
                </p>
              </div>
              <div className="grid gap-1 text-center p-4 rounded-lg hover:shadow-xl transition-shadow">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21.25 8.25H2.75"/><path d="M18 12H6"/><path d="M21.25 15.75H2.75"/></svg>
                </div>
                <h3 className="text-xl font-bold font-headline">Professional Export</h3>
                <p className="text-sm text-muted-foreground">
                  Get a final, mixed MP3 with automatic audio ducking for clear, professional-sounding results.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Timbro. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy Policy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
