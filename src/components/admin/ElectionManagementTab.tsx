import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ElectionDeletion } from '../ElectionDeletion';
import { StepUpVerification } from '../StepUpVerification';
import { Vote, Eye, EyeOff, Search, Filter, ChevronDown } from 'lucide-react';

interface Election {
  id: string;
  title: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  eligible_voters: string;
  show_results_to_voters: boolean;
  created_at: string;
}

interface ElectionManagementTabProps {
  elections: Election[];
  loading: boolean;
  toggleResultsVisibility: (electionId: string, showResults: boolean) => Promise<void>;
  fetchElections: () => Promise<void>;
}

export const ElectionManagementTab = ({
  elections,
  loading,
  toggleResultsVisibility,
  fetchElections
}: ElectionManagementTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const electionsPerPage = 8;

  // Filter elections
  const filteredElections = elections.filter(election => {
    const matchesSearch = !searchTerm || 
      election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      election.eligible_voters.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || election.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Paginate elections
  const totalPages = Math.ceil(filteredElections.length / electionsPerPage);
  const paginatedElections = filteredElections.slice(
    (currentPage - 1) * electionsPerPage,
    currentPage * electionsPerPage
  );

  const statuses = ['All', 'Upcoming', 'Active', 'Completed'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Upcoming': return 'bg-blue-500';
      case 'Completed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Vote className="h-5 w-5" />
            Election Management ({filteredElections.length} elections)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </CardTitle>
        
        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search elections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {showFilters && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {paginatedElections.map(election => (
            <div key={election.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-medium text-lg truncate">{election.title}</h4>
                    <Badge className={`${getStatusColor(election.status)} text-white text-xs`}>
                      {election.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                    <span>Start: {new Date(election.start_date).toLocaleDateString()}</span>
                    <span>End: {new Date(election.end_date).toLocaleDateString()}</span>
                    <span>Eligible: {election.eligible_voters || 'All Courses'}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">{election.description}</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                   {/* Results Visibility Toggle */}
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                     <StepUpVerification
                       onVerified={() => toggleResultsVisibility(election.id, !election.show_results_to_voters)}
                       actionType="toggle_results"
                       title="Verify Identity"
                       description="Please verify your identity to change results visibility."
                     >
                       <Button
                         variant="outline"
                         size="sm"
                         disabled={loading}
                         className={`flex items-center gap-1 w-full sm:w-auto ${
                           election.show_results_to_voters 
                             ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                             : 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
                         }`}
                       >
                         {election.show_results_to_voters ? (
                           <>
                             <Eye className="h-3 w-3" />
                             <span className="sm:hidden">Hide Results</span>
                             <span className="hidden sm:inline">Hide Results</span>
                           </>
                         ) : (
                           <>
                             <EyeOff className="h-3 w-3" />
                             <span className="sm:hidden">Show Results</span>
                             <span className="hidden sm:inline">Show Results</span>
                           </>
                         )}
                       </Button>
                     </StepUpVerification>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        election.show_results_to_voters 
                          ? 'border-green-200 text-green-700' 
                          : 'border-red-200 text-red-700'
                      }`}
                    >
                      {election.show_results_to_voters ? 'Visible' : 'Hidden'}
                    </Badge>
                  </div>
                  
                  <ElectionDeletion 
                    election={election} 
                    onDeleted={() => fetchElections()}
                  />
                </div>
              </div>
            </div>
          ))}
          
          {filteredElections.length === 0 && (
            <div className="text-center py-8">
              <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'All' 
                  ? 'No elections match your search criteria' 
                  : 'No elections found'
                }
              </p>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-muted-foreground">...</span>
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 p-0"
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};