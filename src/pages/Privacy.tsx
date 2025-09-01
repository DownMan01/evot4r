import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Database, Users, Lock, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  const principles = [
    {
      icon: Shield,
      title: "Data Protection",
      description: "Your personal information is protected by secure storage and encrypted transmission provided by our hosting platform."
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "We clearly explain what data we collect, how we use it, and with whom we share it."
    },
    {
      icon: Lock,
      title: "Vote Privacy",
      description: "Your voting choices are completely anonymous and cannot be traced back to you."
    },
    {
      icon: Users,
      title: "User Control",
      description: "You have control over your personal data and can request access, updates, or deletion."
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
            Privacy Policy
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
            Your privacy is fundamental to our mission at Saint Joseph College of Sindangan, Inc. Learn how we protect and respect your data.
          </p>
          <p className="text-white/80 mt-3 md:mt-4 text-xs md:text-base">Last updated: August 2025</p>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-3 md:px-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-8 md:mb-12">
            Our Privacy Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
            {principles.map((principle, index) => (
              <Card key={index} className="text-center">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    <principle.icon className="h-12 w-12 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{principle.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{principle.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-4xl mx-auto prose prose-lg">
            <div className="space-y-8 md:space-y-12">
              
              {/* Information We Collect */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Information We Collect
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Personal Information</h4>
                    <p className="text-muted-foreground">
                      We collect information you provide directly, such as your name, email address, 
                      student ID, and your school information when you register for an account.
                    </p>
                  </div>
                   <div>
                     <h4 className="font-semibold text-foreground mb-2">Voting Data</h4>
                     <p className="text-muted-foreground">
                       We record that you participated in an election through secure voting sessions, 
                       but your actual vote choices are immediately anonymized and separated from your identity.
                     </p>
                   </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Technical Information</h4>
                    <p className="text-muted-foreground">
                      We automatically collect certain technical information like IP addresses, 
                      browser type, and access times for security and system optimization purposes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* How We Use Information */}
              <Card>
                <CardHeader>
                  <CardTitle>How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>To provide and maintain the voting platform</li>
                    <li>To verify your eligibility for specific elections</li>
                    <li>To prevent fraud and ensure election integrity</li>
                    <li>To communicate important updates about elections</li>
                    <li>To provide technical support when needed</li>
                    <li>To improve our platform and user experience</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Vote Anonymity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-success" />
                    Vote Anonymity Guarantee
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    <strong>Your vote is completely anonymous.</strong> Here's how we ensure this:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>Votes are anonymized immediately upon submission</li>
                    <li>Vote data is separated from voter identity before storage</li>
                    <li>No one, including system administrators, can see how you voted</li>
                     <li>Vote tallies are computed without revealing individual choices</li>
                     <li>Database security ensures votes cannot be altered after submission</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Sharing */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Sharing and Disclosure</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    We do not sell, trade, or rent your personal information to third parties. 
                    We may share information only in these limited circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li>With Saint Joseph College of Sindangan, Inc. (only participation data, not vote choices)</li>
                    <li>With authorized election administrators for election management</li>
                    <li>When required by law or to protect the rights and safety of users</li>
                    <li>With service providers who help us operate the platform (under strict confidentiality)</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Security */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Security</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-muted-foreground mb-4">
                     We implement comprehensive security measures to protect your data:
                   </p>
                   <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                     <li>Sensitive information is protected through secure storage and strict access controls.</li>
                     <li>Role-based access controls limiting data access by user type</li>
                     <li>Secure voting session management with time-based expiration</li>
                     <li>Regular security monitoring and access logging</li>
                     <li>Secure backup and disaster recovery procedures</li>
                   </ul>
                </CardContent>
              </Card>

              {/* Your Rights */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Rights and Choices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground mb-4">You have the following rights regarding your data:</p>
                  <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                    <li><strong>Access:</strong> Request a copy of the personal data we have about you</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate personal data</li>
                    <li><strong>Deletion:</strong> Request deletion of your personal data (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Request a copy of your data in a machine-readable format</li>
                    <li><strong>Objection:</strong> Object to certain types of data processing</li>
                  </ul>
                </CardContent>
              </Card>

              {/* Data Retention */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Retention</CardTitle>
                </CardHeader>
                <CardContent>
                <p className="text-muted-foreground">
                  We retain your personal information only for as long as necessary to provide our services 
                  and comply with SJCSI requirements. Anonymized vote data is retained for audit 
                  purposes as required by student election regulations. Personal account information is managed 
                  according to SJCSI's data retention policies.
                </p>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    If you have questions about this Privacy Policy or want to exercise your data rights, please contact us:
                  </p>
                   <div className="space-y-2 text-muted-foreground">
                     <p><strong>Email:</strong> support@evotar.xyz</p>
                     <p><strong>Address:</strong> Student Affairs Office, Saint Joseph College of Sindangan, Inc.</p>
                     <p><strong>Response Time:</strong> We aim to respond to all privacy inquiries within 30 days</p>
                   </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto border-warning">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Important Notice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This privacy policy may be updated from time to time to reflect changes in our practices 
                or legal requirements. We will notify users of significant changes via email or platform 
                notifications. Continued use of the platform after changes indicates acceptance of the updated policy.
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

export default Privacy;
