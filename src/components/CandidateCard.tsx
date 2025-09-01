import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useState } from 'react';
import { Eye, Award } from 'lucide-react';
import { SecureImage } from '@/components/ui/SecureImage';

interface Candidate {
  id: string;
  full_name: string;
  bio: string | null;
  image_url: string | null;
  position_title: string;
  election_title: string;
  election_status: string;
  why_vote_me?: string | null;
  jhs_school?: string | null;
  jhs_graduation_year?: number | null;
  shs_school?: string | null;
  shs_graduation_year?: number | null;
  partylist?: string | null;
}

interface CandidateCardProps {
  candidate: Candidate;
  showElectionInfo?: boolean;
}

export const CandidateCard = ({ candidate, showElectionInfo = true }: CandidateCardProps) => {
  const [showDetails, setShowDetails] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-500';
      case 'Upcoming':
        return 'bg-blue-500';
      case 'Completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  return (
    <>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-background to-muted/20 h-full">
        <div className="relative h-full flex flex-col">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50" />
          
          <CardHeader className="relative text-center pb-3 pt-4 lg:pb-4 lg:pt-6 flex-shrink-0">
            <div className="relative mx-auto mb-3 lg:mb-4">
              <Avatar className="h-20 w-20 lg:h-24 lg:w-24 mx-auto ring-2 lg:ring-4 ring-background shadow-lg">
                <SecureImage 
                  bucket="candidate-profiles"
                  path={candidate.image_url}
                  alt={candidate.full_name}
                  className="h-20 w-20 lg:h-24 lg:w-24 rounded-full object-cover"
                  fallback={
                    <AvatarFallback className="text-lg lg:text-xl font-semibold bg-gradient-to-br from-primary to-secondary text-primary-foreground h-20 w-20 lg:h-24 lg:w-24">
                      {getInitials(candidate.full_name)}
                    </AvatarFallback>
                  }
                />
              </Avatar>
              <div className="absolute -bottom-1 -right-1 lg:-bottom-2 lg:-right-2 bg-primary text-primary-foreground rounded-full p-1.5 lg:p-2">
                <Award className="h-3 w-3 lg:h-4 lg:w-4" />
              </div>
            </div>
            
            <h3 className="font-bold text-base lg:text-lg text-foreground transition-colors leading-tight">
              {candidate.full_name}
            </h3>
            
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs lg:text-sm font-medium">
                Running for {candidate.position_title}
              </Badge>
              
              {showElectionInfo && (
                <div className="flex justify-center">
                  <Badge 
                    className={`${getStatusColor(candidate.election_status)} text-white text-xs px-2 lg:px-3 py-1`}
                  >
                    <span className="truncate max-w-[150px]">{candidate.election_title}</span>
                  </Badge>
                </div>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="relative pt-0 pb-4 lg:pb-6 flex-1 flex flex-col justify-between">
            <div className="flex-1">
              {candidate.bio ? (
                <p className="text-xs lg:text-sm text-muted-foreground text-center line-clamp-2 lg:line-clamp-3 mb-3 lg:mb-4 leading-relaxed">
                  {candidate.bio}
                </p>
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center italic mb-3 lg:mb-4">
                  No biography available
                </p>
              )}
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDetails(true)}
              className="w-full h-9 lg:h-10 group-hover:bg-primary group-hover:text-primary-foreground transition-all text-xs lg:text-sm"
            >
              <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-2" />
              View Details
            </Button>
          </CardContent>
        </div>
      </Card>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-20 w-20 ring-4 ring-primary/20">
                <SecureImage 
                  bucket="candidate-profiles"
                  path={candidate.image_url}
                  alt={candidate.full_name}
                  className="h-20 w-20 rounded-full object-cover"
                  fallback={
                    <AvatarFallback className="text-lg font-semibold h-20 w-20">
                      {getInitials(candidate.full_name)}
                    </AvatarFallback>
                  }
                />
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{candidate.full_name}</DialogTitle>
                <div className="space-y-2">
                  <Badge variant="secondary" className="text-sm">
                    Running for {candidate.position_title}
                  </Badge>
                  {showElectionInfo && (
                    <div>
                      <Badge className={`${getStatusColor(candidate.election_status)} text-white`}>
                        {candidate.election_title}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">Biography</h4>
              {candidate.bio ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {candidate.bio}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No detailed biography available for this candidate.
                </p>
              )}
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-3 text-foreground">Why Vote for Me?</h4>
              {candidate.why_vote_me?.trim() ? (
                <div className="prose prose-sm max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {candidate.why_vote_me}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No explanation provided by the candidate.
                </p>
              )}
            </div>

            {/* Campaign Information */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="text-lg font-semibold mb-3 text-foreground">Campaign Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Position */}
                <div>
                  <span className="font-medium text-foreground">Running for:</span>
                  <p className="text-muted-foreground">
                    {candidate.position_title?.trim() || "No position specified"}
                  </p>
                </div>

                {/* Election Title */}
                {showElectionInfo && (
                  <div>
                    <span className="font-medium text-foreground">Election:</span>
                    <p className="text-muted-foreground">
                      {candidate.election_title?.trim() || "No election title available"}
                    </p>
                  </div>
                )}

                {/* Partylist */}
                <div>
                  <span className="font-medium text-foreground">Partylist:</span>
                  <p className="text-muted-foreground">
                    {candidate.partylist?.trim() || "Independent"}
                  </p>
                </div>

                {/* Election Status */}
                <div>
                  <span className="font-medium text-foreground">Election Status:</span>
                  <Badge className={`${getStatusColor(candidate.election_status)} text-white ml-2 text-xs`}>
                    {candidate.election_status || "Unknown"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Educational Background */}
            {(candidate.jhs_school?.trim() || candidate.shs_school?.trim()) ? (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 text-foreground">Educational Background</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Junior High School */}
                  {candidate.jhs_school?.trim() && (
                    <div>
                      <span className="font-medium text-foreground">Junior High School:</span>
                      <p className="text-muted-foreground">{candidate.jhs_school}</p>
                      {candidate.jhs_graduation_year && (
                        <p className="text-muted-foreground text-xs">
                          Graduated: {candidate.jhs_graduation_year}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Senior High School */}
                  {candidate.shs_school?.trim() && (
                    <div>
                      <span className="font-medium text-foreground">Senior High School:</span>
                      <p className="text-muted-foreground">{candidate.shs_school}</p>
                      {candidate.shs_graduation_year && (
                        <p className="text-muted-foreground text-xs">
                          Graduated: {candidate.shs_graduation_year}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-3 text-foreground">Educational Background</h4>
                <p className="text-muted-foreground italic text-sm">
                  No educational background provided.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};