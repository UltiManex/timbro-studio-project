import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold font-headline">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Welcome to Timbro!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Timbro ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, then you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Description of Service</h2>
              <p>
                Timbro provides AI-powered audio post-production tools, including but not limited to audio analysis, sound effect suggestions, an interactive editor, and audio export functionalities.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. User Accounts</h2>
              <p>
                To use certain features of the Service, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete. You are responsible for safeguarding your password and for all activities that occur under your account.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. User Content</h2>
              <p>
                You retain all rights to any audio files or other content you upload to the Service ("User Content"). By uploading User Content, you grant Timbro a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and process such User Content solely for the purpose of providing the Service to you. We are committed to the privacy and security of your User Content as outlined in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Free Trial and Subscriptions</h2>
              <p>
                Timbro may offer a free trial period, subject to limitations (e.g., processing time or duration). Continued use of the Service beyond the trial period or for premium features requires a paid subscription. Subscription terms, pricing, and payment details will be provided at the time of purchase.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Prohibited Conduct</h2>
              <p>
                You agree not to use the Service for any unlawful purpose or in any way that interrupts, damages, or impairs the service. This includes uploading malicious content, attempting unauthorized access, or infringing on intellectual property rights.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. Disclaimers and Limitation of Liability</h2>
              <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. Timbro makes no warranties, expressed or implied, and hereby disclaims all other warranties. In no event shall Timbro be liable for any indirect, incidental, special, consequential or punitive damages.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms on this page.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">10. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please <Link href="/support" className="text-primary hover:underline">contact us</Link>.
              </p>
            </section>
            
            <div className="text-center mt-8">
                <Link href="/" className="text-primary hover:underline">
                    &larr; Back to Homepage
                </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
