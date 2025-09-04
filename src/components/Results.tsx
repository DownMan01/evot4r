import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RefreshButton } from '@/components/ui/refresh-button';
import { VotingAnalyticsDialog } from '@/components/VotingAnalyticsDialog';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { ResultsViewSkeleton } from '@/components/UnifiedLoadingSkeleton';
import { ExternalLink, Trophy, TrendingUp, Search, BarChart3 } from 'lucide-react';

interface ElectionResult {
  election_id: string;
  election_title: string;
  election_status: string;
  eligible_voters: string;
  show_results_to_voters: boolean;
  position_id: string;
  position_title: string;
  candidate_id: string;
  candidate_name: string;
  vote_count: number;
  total_votes_in_position: number;
  total_eligible_voters_count: number;
  position_eligible_voters_count: number;
  percentage: number;
}

interface GroupedResults {
  [electionId: string]: {
    election_title: string;
    eligible_voters: string;
    show_results_to_voters: boolean;
    tx_hash?: string; 
    positions: {
      [positionId: string]: {
        position_title: string;
        candidates: ElectionResult[];
        total_votes: number;
        total_eligible_voters: number;
        rank: number;
      };
    };
  };
}

const getPositionRank = (positionTitle: string): number => {
  const normalizedTitle = positionTitle.toUpperCase().trim();
  const positionRanks: { [key: string]: number } = {
    PRESIDENT: 1,
    'V-PRESIDENT': 2,
    'VICE-PRESIDENT': 2,
    'INTERNAL VICE-PRESIDENT': 3,
    'EXTERNAL VICE-PRESIDENT': 4,
    SECRETARY: 5,
    TREASURER: 6,
    AUDITOR: 7,
    'BUSINESS MANAGER': 8,
    'BUSINESS MANAGER 1': 8,
    'BUSINESS MANAGER 2': 9,
    'PROJECT MANAGER 1': 10,
    'PROJECT MANAGER 2': 11,
    'S. I. O.': 12,
    'P. I. O.': 12,
    MUSE: 13,
    ESCORT: 14,
    'SRGT @ ARMS': 15,
    SENATOR: 20,
    GOVERNOR: 21,
    'V-GOVERNOR': 22,
    'VICE-GOVERNOR': 22,
    '1ST YEAR REPRESENTATIVE': 30,
    '2ND YEAR REPRESENTATIVE': 31,
    '3RD YEAR REPRESENTATIVE': 32,
    '4TH YEAR REPRESENTATIVE': 33,
    'REPRESENTATIVES 1': 30,
    'REPRESENTATIVES 2': 31,
    'REPRESENTATIVES 3': 32,
    'REPRESENTATIVES 4': 33,
    'REPRESENTATIVE 1': 30,
    'REPRESENTATIVE 2': 31,
    'REPRESENTATIVE 3': 32,
    'REPRESENTATIVE 4': 33,
  };

  if (positionRanks[normalizedTitle]) return positionRanks[normalizedTitle];

  for (const [key, rank] of Object.entries(positionRanks)) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) return rank;
  }

  return 999;
};

export const Results = () => {
  const [results, setResults] = useState<GroupedResults>({});
  const [filteredResults, setFilteredResults] = useState<GroupedResults>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasInitialized, setHasInitialized] = useState(false);
  const [electionAnalyticsOpen, setElectionAnalyticsOpen] = useState(false);
  const [selectedElectionForAnalytics, setSelectedElectionForAnalytics] = useState<string>('');
  const { isStaff, isAdmin } = usePermissions();

  const show_results_to_voters_bool = (val: boolean | null | undefined) => Boolean(val);

  const canViewResults = useMemo(() => {
    return (electionStatus: string, showResultsToVoters: boolean) => {
      if (isAdmin || isStaff) return true;
      return electionStatus === 'Completed' && show_results_to_voters_bool(showResultsToVoters);
    };
  }, [isAdmin, isStaff]);

  const fetchResults = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);
      setError(null);

      const { data: allResultsData, error: resultsError } = await supabase.rpc('get_all_election_results_optimized');
      if (resultsError) throw resultsError;
      if (!allResultsData || allResultsData.length === 0) {
        setResults({});
        setFilteredResults({});
        return;
      }

      const visibleResults = allResultsData.filter((result: any) =>
        canViewResults(result.election_status, result.show_results_to_voters)
      );

      if (visibleResults.length === 0) {
        setResults({});
        setFilteredResults({});
        return;
      }

      const grouped: GroupedResults = {};

      for (const result of visibleResults) {
        if (!grouped[result.election_id]) {
          grouped[result.election_id] = {
            election_title: result.election_title,
            eligible_voters: result.eligible_voters,
            show_results_to_voters: result.show_results_to_voters,
            positions: {},
          };
        }

        if (!grouped[result.election_id].positions[result.position_id]) {
          grouped[result.election_id].positions[result.position_id] = {
            position_title: result.position_title,
            candidates: [],
            total_votes: 0,
            total_eligible_voters: Number(result.position_eligible_voters_count),
            rank: getPositionRank(result.position_title),
          };
        }

        const candidateResult: ElectionResult = {
          election_id: result.election_id,
          election_title: result.election_title,
          election_status: result.election_status,
          eligible_voters: result.eligible_voters,
          show_results_to_voters: result.show_results_to_voters,
          position_id: result.position_id,
          position_title: result.position_title,
          candidate_id: result.candidate_id,
          candidate_name: result.candidate_name,
          vote_count: Number(result.vote_count),
          total_votes_in_position: Number(result.total_votes_in_position),
          total_eligible_voters_count: Number(result.total_eligible_voters_count),
          position_eligible_voters_count: Number(result.position_eligible_voters_count),
          percentage: Number(result.percentage),
        };

        grouped[result.election_id].positions[result.position_id].candidates.push(candidateResult);

        if (!grouped[result.election_id].positions[result.position_id].total_votes) {
          grouped[result.election_id].positions[result.position_id].total_votes = Number(result.total_votes_in_position);
        }
      }

      for (const electionId of Object.keys(grouped)) {
        const { data: proofData, error: proofError } = await supabase
          .rpc('get_election_blockchain_proofs', { p_election_id: electionId })
          .single();

        if (!proofError && proofData) {
          grouped[electionId].tx_hash = proofData.tx_hash;
        }
      }

      Object.values(grouped).forEach(election => {
        Object.values(election.positions).forEach(position => {
          position.candidates.sort((a, b) => b.vote_count - a.vote_count);
        });
      });

      setResults(grouped);
      setFilteredResults(grouped);
    } catch (error: any) {
      console.error('Error fetching results:', error);
      setError('Failed to load results. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [canViewResults, loading]);

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      fetchResults();
    }
  }, [hasInitialized, fetchResults]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredResults(results);
      return;
    }

    const filtered: GroupedResults = {};
    const lowerSearch = searchTerm.toLowerCase();

    Object.entries(results).forEach(([electionId, election]) => {
      const electionMatches = election.election_title.toLowerCase().includes(lowerSearch);
      const filteredPositions: typeof election.positions = {};

      Object.entries(election.positions).forEach(([positionId, position]) => {
        const positionMatches = position.position_title.toLowerCase().includes(lowerSearch);
        const candidateMatches = position.candidates.some(candidate =>
          candidate.candidate_name.toLowerCase().includes(lowerSearch)
        );

        if (electionMatches || positionMatches || candidateMatches) {
          filteredPositions[positionId] = position;
        }
      });

      if (Object.keys(filteredPositions).length > 0) {
        filtered[electionId] = { ...election, positions: filteredPositions };
      }
    });

    setFilteredResults(filtered);
  }, [results, searchTerm]);

  const electionsForAnalytics = useMemo(() => {
    return Object.entries(results).map(([electionId, election]) => ({
      election_id: electionId,
      election_title: election.election_title,
    }));
  }, [results]);

  if (loading) return <ResultsViewSkeleton />;

  return (
    <>
      <div className="space-y-3 lg:space-y-4 pb-4 lg:pb-0 p-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <h2 className="text-lg lg:text-2xl font-bold"></h2>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
                onClick={() => window.open('https://blockchain.evotar.xyz/', '_blank')}
                className="flex items-center gap-2 flex-1 sm:flex-initial"
                  >
            <ExternalLink className="h-4 w-4" />
                Verify Results
            </Button>

      <RefreshButton
          onClick={fetchResults}
          loading={loading}
          disabled={loading}
          className="flex-1 sm:flex-initial"
          text="Refresh Data"
          mobileText="Refresh"
            />
      </div>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            placeholder="Search by election, position, or candidate..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {error && (
          <div className="text-center py-6">
            <p className="text-destructive mb-2">{error}</p>
            <Button onClick={fetchResults} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && Object.keys(filteredResults).length === 0 ? (
          <Card>
            <CardContent className="text-center py-6">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-1">
                {searchTerm ? 'No results match your search' : 'No results available'}
              </p>
              <p className="text-xs text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'Results will appear here once elections are completed.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 pb-4">
            {Object.entries(filteredResults).map(([electionId, election]) => (
              <Card key={electionId} className="overflow-hidden">
                <CardHeader className="pb-3 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Trophy className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <CardTitle className="text-base lg:text-lg truncate">{election.election_title}</CardTitle>
                      {election.tx_hash && (
                        <a
                          href={`https://testnet.polygonscan.com/tx/${election.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center h-7 px-2 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:hover:bg-blue-800 transition"
                        >
                          Blockchain Tx: {election.tx_hash.slice(0, 5)}...
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">{election.eligible_voters}</Badge>
                      {(isStaff || isAdmin || (election.show_results_to_voters && Object.values(election.positions).length > 0)) && (
                        <Button
                          onClick={() => {
                            setSelectedElectionForAnalytics(electionId);
                            setElectionAnalyticsOpen(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs leading-none min-h-0"
                        >
                          <BarChart3 className="h-3 w-3 mr-1" />
                          View Analytics
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 pt-0">
                  {Object.entries(election.positions)
                    .sort(([, a], [, b]) => a.rank - b.rank)
                    .map(([positionId, position]) => (
                      <div key={positionId} className="space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <h3 className="text-sm font-semibold leading-tight">{position.position_title}</h3>
                          <Badge variant="outline" className="text-xs w-fit flex items-center gap-1">
                            <TrendingUp className="h-2 w-2" />
                            {position.total_votes} votes
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {position.candidates.map((candidate, index) => {
                            const isWinner = index === 0 && candidate.vote_count > 0;
                            const formattedPercentage = candidate.percentage.toFixed(3);
                            const eligibleCount = position.total_eligible_voters;
                            const turnoutPct = eligibleCount > 0 ? ((position.total_votes / eligibleCount) * 100).toFixed(1) : '0.0';

                            return (
                              <div
                                key={candidate.candidate_id}
                                className={`p-3 rounded-lg border transition-colors ${
                                  isWinner
                                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                                    : 'border-border bg-card hover:bg-accent/50'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    {isWinner && <Trophy className="h-3 w-3 text-green-600 flex-shrink-0" />}
                                    <span className="font-medium text-sm truncate">{candidate.candidate_name}</span>
                                    {isWinner && (
                                      <Badge className="bg-green-600 text-white text-xs hover:bg-green-600">Winner</Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground text-right">
                                    <div className="font-medium">{candidate.vote_count} votes</div>
                                    <div>({formattedPercentage}%)</div>
                                  </div>
                                </div>
                                <Progress value={candidate.percentage} className="h-2 mb-2" />
                                <div className="text-xs text-muted-foreground">
                                  {position.total_votes} of {eligibleCount} eligible voters voted ({turnoutPct}% turnout)
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <VotingAnalyticsDialog
        open={electionAnalyticsOpen}
        onOpenChange={setElectionAnalyticsOpen}
        elections={electionsForAnalytics}
        preSelectedElection={selectedElectionForAnalytics}
      />
    </>
  );
};

export default Results;
