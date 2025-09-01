import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
  const navigate = useNavigate();

  const keyPoints = [
    {
      icon: CheckCircle,
      title: "Platform Access",
      description: "Use Evotar responsibly and only for authorized elections and voting activities."
    },
    {
      icon: Scale,
      title: "Fair Use",
      description: "Respect the democratic process and do not attempt to manipulate or interfere with elections."
    },
    {
      icon: FileText,
      title: "Account Security",
      description: "Maintain the confidentiality of your login credentials and report security concerns promptly."
    },
    {
      icon: AlertTriangle,
      title: "Prohibited Activities",
      description: "Do not engage in fraud, vote manipulation, or any activities that compromise election integrity."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
          <h1 className="text-lg md:text-2xl font-krona text-primary">evotar</h1>
          <Button variant="outline" onClick={() => navigate('/')} size="sm" className="text-sm touch-manipulation">
            <span className="hidden sm:inline">Back to Home</span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-8 md:py-16 bg-gradient-to-br from-primary via-primary-600 to-primary-700">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <h1 className="text-2xl sm:text-3xl md:text-6xl font-krona text-white mb-4 md:mb-6 leading-tight">
            Terms of Service
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
            Please read these terms carefully. By using Evotar at Saint Joseph College of Sindangan, Inc., you agree to these conditions.
          </p>
          <p className="text-white/80 mt-3 md:mt-4 text-xs md:text-base">Last updated: August 2025</p>
        </div>
      </section>

      {/* Key Points */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-8 md:mb-12">
            Key Terms Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
            {keyPoints.map((point, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <point.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{point.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8 md:space-y-12">

              {/* Acceptance of Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    By accessing and using the Evotar digital voting platform, you acknowledge that you have read, 
                    understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do 
                    not agree with these terms, you must not use our platform.
                  </p>
                  <p className="text-muted-foreground">
                    These terms constitute a legally binding agreement between you and Evotar. We may update these 
                    terms from time to time, and continued use of the platform indicates acceptance of any changes.
                  </p>
                </CardContent>
              </Card>

              {/* Eligibility and Account Registration */}
              <Card>
                <CardHeader>
                  <CardTitle>2. Eligibility and Account Registration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <h4 className="font-semibold text-foreground mb-2">Eligibility Requirements</h4>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                       <li>You must be a student or SAO administrator of Saint Joseph College of Sindangan, Inc.</li>
                       <li>You must have the appropriate role (Voter, Staff) assigned by the SAO administrator</li>
                       <li>You must be eligible to participate in the specific SJCSI elections for which you are voting</li>
                       <li>You must provide accurate and complete registration information</li>
                     </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Account Responsibilities</h4>
                    <p className="text-muted-foreground">
                      You are responsible for maintaining the confidentiality of your account credentials and for all 
                      activities that occur under your account. You must notify us immediately of any unauthorized 
                      access or security breaches.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Use and Conduct */}
              <Card>
                <CardHeader>
                  <CardTitle>3. Platform Use and Conduct</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                     <h4 className="font-semibold text-foreground mb-2">Permitted Use</h4>
                     <p className="text-muted-foreground mb-2">You may use Evotar to:</p>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                       <li>Participate in authorized SJCSI student elections based on your role</li>
                       <li>Manage users, elections, and candidates if you have Admin privileges</li>
                       <li>Review and manage candidates if you have Staff privileges</li>
                       <li>Access your account information</li>
                       <li>Receive election-related communications and updates</li>
                     </ul>
                  </div>
                  <div>
                     <h4 className="font-semibold text-foreground mb-2">Prohibited Activities</h4>
                     <p className="text-muted-foreground mb-2">You must NOT:</p>
                     <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                       <li>Attempt to vote multiple times in the same election</li>
                       <li>Share your account credentials with others</li>
                       <li>Access features beyond your assigned role permissions</li>
                       <li>Attempt to manipulate voting sessions or results</li>
                       <li>Interfere with the platform's operation or security measures</li>
                       <li>Use the platform for any fraudulent or illegal activities</li>
                     </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Voting Integrity */}
              <Card>
                <CardHeader>
                  <CardTitle>4. Voting Integrity and Election Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    You agree to participate in elections honestly and in accordance with democratic principles. 
                    This includes:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Casting votes based on your own genuine preferences</li>
                    <li>Not accepting compensation for your vote or voting choices</li>
                    <li>Respecting the confidentiality of the voting process</li>
                    <li>Following all election-specific rules and deadlines</li>
                    <li>Reporting any suspected fraud or irregularities to administrators</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data and Privacy */}
              <Card>
                <CardHeader>
                  <CardTitle>5. Data and Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">
                     Your privacy is important to us. Our collection, use, and protection of your personal information 
                     is governed by our Privacy Policy, which is incorporated into these terms by reference.
                   </p>
                   <p className="text-muted-foreground">
                     By using the platform, you consent to the collection and use of your information as described 
                     in our Privacy Policy. You also acknowledge that anonymized vote data may be retained for audit 
                     purposes while maintaining complete voter anonymity.
                   </p>
                </CardContent>
              </Card>

              {/* Platform Availability */}
              <Card>
                <CardHeader>
                  <CardTitle>6. Platform Availability and Limitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We strive to maintain high platform availability but cannot guarantee uninterrupted access. 
                    The platform may be temporarily unavailable due to:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Scheduled maintenance and updates</li>
                    <li>Technical difficulties or system failures</li>
                    <li>Security incidents requiring platform suspension</li>
                    <li>Force majeure events beyond our control</li>
                  </ul>
                  <p className="text-muted-foreground">
                    We will make reasonable efforts to provide advance notice of planned downtime and to restore 
                    service as quickly as possible during unplanned outages.
                  </p>
                </CardContent>
              </Card>

              {/* Intellectual Property */}
              <Card>
                <CardHeader>
                  <CardTitle>7. Intellectual Property</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">
                     All content, features, and functionality of the Evotar student voting platform for SJCSI, including 
                     text, graphics, logos, software, and design elements, are owned by Evotar and protected by 
                     copyright, trademark, and other intellectual property laws.
                   </p>
                   <p className="text-muted-foreground">
                     You may not copy, modify, distribute, sell, or lease any part of our platform or its content 
                     without our express written permission.
                   </p>
                </CardContent>
              </Card>

              {/* Limitation of Liability */}
              <Card>
                <CardHeader>
                  <CardTitle>8. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    To the fullest extent permitted by law, Evotar shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred 
                    directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
                  </p>
                   <p className="text-muted-foreground">
                     Our total liability for any claims related to the platform shall not exceed the institutional fees paid by 
                     SJCSI for the services during the twelve months preceding the claim.
                   </p>
                </CardContent>
              </Card>

              {/* Termination */}
              <Card>
                <CardHeader>
                  <CardTitle>9. Termination</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We may terminate or suspend your access to the platform immediately, without prior notice, if you 
                    violate these terms or engage in conduct that we determine to be harmful to the platform, other users, 
                    or election integrity.
                  </p>
                   <p className="text-muted-foreground">
                     You may terminate your account at any time by contacting SAO's election administrator. Upon 
                     termination, your right to use the platform ceases, but certain provisions of these terms will 
                     survive termination.
                   </p>
                </CardContent>
              </Card>

              {/* Governing Law */}
              <Card>
                <CardHeader>
                  <CardTitle>10. Governing Law and Disputes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-muted-foreground">
                     These terms shall be governed by and construed in accordance with the laws of the Philippines, 
                     without regard to its conflict of law provisions. Any disputes arising from these terms or your 
                     use of the platform shall be resolved through the appropriate Philippine legal channels.
                   </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>11. Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                   <div className="space-y-2 text-muted-foreground">
                     <p><strong>Email:</strong> support@evotar.xyz</p>
                     <p><strong>Address:</strong> Student Affairs Office, Saint Joseph College of Sindangan, Inc.</p>
                   </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* Agreement Notice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                By Using Evotar, You Agree
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your continued use of the Evotar platform constitutes acceptance of these Terms of Service and our 
                Privacy Policy. If you do not agree with any part of these terms, please discontinue use of the platform immediately.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background border-t py-6 md:py-8">
        <div className="container mx-auto px-3 md:px-4 text-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-4 text-sm text-muted-foreground">
            <button onClick={() => navigate('/about')} className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">About</button>
            <button onClick={() => navigate('/faq')} className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">FAQ</button>
            <button onClick={() => navigate('/privacy')} className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">Privacy</button>
            <button onClick={() => navigate('/terms')} className="hover:text-primary transition-colors touch-manipulation min-h-[44px] flex items-center">Terms</button>
          </div>
          <p className="text-muted-foreground text-sm">Evotar © 2025. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
