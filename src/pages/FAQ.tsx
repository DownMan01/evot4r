import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "How secure is my vote on Evotar?",
      answer: "Your vote is protected by secure session management. Each vote is immediately anonymized upon submission and cannot be traced back to you. We use role-based access controls and industry-standard security protocols to ensure the integrity of every election."
    },
    {
      question: "Can I change my vote after submitting?",
      answer: "No, once you submit your vote, it cannot be changed. This ensures election integrity and prevents vote manipulation. You'll see a confirmation dialog before finalizing your vote, so please review your selections carefully."
    },
    {
      question: "What if I forget my login credentials?",
      answer: "You can reset your password using the 'Forgot Password' link on the login page. If you don't remember your email or student ID, contact the SJCSI IT support or election administrators for assistance."
    },
    {
      question: "Why can't I access the voting system?",
      answer: "There are several possible reasons: 1) The election may not have started yet, 2) The election may have ended, 3) You may not be registered for this specific election, 4) Your account may need verification, or 5) You may not have the required voter role. Contact SJCSI election administrators if issues persist."
    },
    {
      question: "How do I know if my vote was counted?",
      answer: "After submitting your vote, a vote receipt will automatically download, and you'll receive a confirmation screen showing your vote was recorded. You can verify your votes through the QR code in the vote receipt, just scan it."
    },
    {
      question: "Can I vote from my mobile device?",
      answer: "Yes! Evotar is fully responsive and optimized for mobile devices. You can vote securely from your smartphone or tablet using any modern web browser with the same security and functionality as a desktop."
    },
    {
      question: "What browsers are supported?",
      answer: "Evotar works on all modern browsers, including Chrome, Firefox, Safari, and Edge. We recommend using the latest version of your preferred browser for the best experience and security."
    },
    {
      question: "How are election results verified?",
      answer: "Results are verified through our secure database system with comprehensive audit logs. Election administrators can verify the integrity of results through detailed voting session records while maintaining voter anonymity."
    },
    {
      question: "What happens if there's a technical issue during voting?",
      answer: "If you experience technical difficulties, try refreshing your browser first. Your voting session is automatically saved, so you won't lose your progress. If issues persist, contact Evotar technical support immediately."
    },
    {
      question: "Who can see how I voted?",
      answer: "Your vote is completely anonymous. No one, including system administrators, can see how you voted. The system only records that you participated in the election through voting sessions, not your specific candidate choices."
    },
    {
      question: "What roles exist in the system?",
      answer: "Evotar has four main roles: Voters (can cast votes), Staff (can manage approved elections), Admins (can create elections and manage all aspects), and Super Admins (full system access; developer of Evotar). Your role determines what features you can access."
    },
    {
      question: "How do I become a candidate?",
      answer: "To become a candidate, you need to follow SAO's candidate registration process. Once registered, you'll submit your candidate information, including bio, platform, qualifications, and educational background. SAO staff or admins will review and approve candidates before they appear in elections."
    }
  ];

  const categories = [
    {
      title: "Voting Process",
      icon: HelpCircle,
      items: faqs.slice(0, 4)
    },
    {
      title: "Technical Support",
      icon: MessageCircle,
      items: faqs.slice(4, 8)
    },
    {
      title: "Security & Roles",
      icon: HelpCircle,
      items: faqs.slice(8, 12)
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
          <h1 className="text-xl sm:text-2xl md:text-6xl font-krona text-white mb-4 md:mb-6 leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-base md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed px-2">
            Find answers to common questions about using Evotar for SJCSI student elections and voting.
          </p>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-8 md:py-12 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-3 md:mb-4">
              Quick Answers
            </h2>
            <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base px-2">
              Browse our most frequently asked questions organized by category, or scroll down to see all questions.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-3 md:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
            {categories.map((category, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <category.icon className="h-5 w-5 text-primary" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">
                    {category.items.length} questions in this category
                  </p>
                  <div className="space-y-2">
                    {category.items.slice(0, 2).map((item, itemIndex) => (
                      <p key={itemIndex} className="text-xs md:text-sm text-muted-foreground truncate">
                        • {item.question}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* All FAQs */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-semibold text-center text-foreground mb-8 md:mb-12">
              All Questions & Answers
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left hover:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section className="py-8 md:py-16 bg-muted/30">
        <div className="container mx-auto px-3 md:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-6 md:mb-8">
              Still Need Help?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-12 px-2">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex justify-center px-2">
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Mail className="h-5 w-5 text-primary" />
                    Email Support
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm md:text-base">
                    Get detailed help via email. We typically respond within 24 hours.
                  </p>
                  <Button className="w-full touch-manipulation" asChild>
                    <a href="mailto:support@evotar.xyz">
                      Contact Support
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
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

export default FAQ;
