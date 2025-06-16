import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/icons';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-muted/40 py-8 px-4 md:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8 text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo className="h-10 w-auto mx-auto" />
          </Link>
          <h1 className="text-4xl font-bold font-headline">Privacy Policy</h1>
          <p className="text-muted-foreground mt-2">Last Updated: {new Date().toLocaleDateString()}</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">Your Privacy is Important to Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-muted-foreground leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">1. Introduction</h2>
              <p>
                Timbro ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">2. Information We Collect</h2>
              <p>
                We may collect personal information such as your name, email address, and payment information when you create an account or subscribe to our Service. We also collect User Content (audio files) that you upload for processing. Additionally, we may collect non-personal information like usage data and device information.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">3. How We Use Your Information</h2>
              <p>
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Provide, operate, and maintain our Service.</li>
                <li>Process your User Content as requested.</li>
                <li>Improve, personalize, and expand our Service.</li>
                <li>Communicate with you, including for customer service and promotional purposes.</li>
                <li>Process transactions and manage subscriptions.</li>
                <li>Prevent fraudulent activity and ensure security.</li>
              </ul>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">4. How We Protect Your User Content</h2>
              <p>
                Your User Content (audio files) is treated with strict confidentiality. We use it solely for the purpose of providing the audio processing services you request. We implement industry-standard security measures to protect your User Content from unauthorized access, use, or disclosure. We do not claim ownership of your User Content.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">5. Third-Party Services</h2>
              <p>
                We may use third-party services for functions like payment processing (e.g., Stripe), transcription (e.g., OpenAI Whisper API), and content analysis (e.g., OpenAI GPT-4 API). These services have their own privacy policies, and we encourage you to review them. We only share information necessary for them to perform their services.
              </p>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">6. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you services. We may retain User Content for a limited period to allow you to access and download your processed files, after which it may be deleted according to our data retention policies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">7. Your Choices and Rights</h2>
              <p>
                You have the right to access, update, or delete your personal information. You can manage your account settings and communication preferences through the Service. If you wish to delete your account and associated data, please contact us.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">8. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-foreground mb-2">9. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please <Link href="/support" className="text-primary hover:underline">contact us</Link>.
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
