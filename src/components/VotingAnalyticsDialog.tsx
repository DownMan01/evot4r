import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Filter, X, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface VotingAnalyticsData {
  election_id: string;
  election_title: string;
  course: string;
  gender: string;
  unique_voters: number;
  total_course_voters: number;
}

interface PositionAnalyticsData {
  election_id: string;
  election_title: string;
  position_id: string;
  position_title: string;
  course: string;
  gender: string;
  unique_voters: number;
  total_eligible_voters: number;
}

interface VotingAnalyticsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elections: Array<{
    election_id: string;
    election_title: string;
  }>;
  preSelectedElection?: string;
}

const GENDER_COLORS = {
  'Male': '#3B82F6',
  'Female': '#EC4899'
};

// Position hierarchy ranking system
const getPositionRank = (positionTitle: string): number => {
  const normalizedTitle = positionTitle.toUpperCase().trim();
  
  // Define position hierarchy (lower number = higher rank)
  const positionRanks: { [key: string]: number } = {
    // University/College Level
    'PRESIDENT': 1,
    'V-PRESIDENT': 2,
    'VICE-PRESIDENT': 2,
    'INTERNAL VICE-PRESIDENT': 3,
    'EXTERNAL VICE-PRESIDENT': 4,
    'SECRETARY': 5,
    'TREASURER': 6,
    'AUDITOR': 7,
    'BUSINESS MANAGER': 8,
    'BUSINESS MANAGER 1': 8,
    'BUSINESS MANAGER 2': 9,
    'PROJECT MANAGER 1': 10,
    'PROJECT MANAGER 2': 11,
    'S. I. O.': 12,
    'P. I. O.': 12,
    'MUSE': 13,
    'ESCORT': 14,
    'SRGT @ ARMS': 15,
    
    // Regional/Provincial Level
    'SENATOR': 20,
    'GOVERNOR': 21,
    'V-GOVERNOR': 22,
    'VICE-GOVERNOR': 22,
    
    // Representatives
    '1ST YEAR REPRESENTATIVE': 30,
    '2ND YEAR REPRESENTATIVE': 31,
    '3RD YEAR REPRESENTATIVE': 32,
    '4TH YEAR REPRESENTATIVE': 33,
    // Backwards compatibility (old labels)
    'REPRESENTATIVES 1': 30,
    'REPRESENTATIVES 2': 31,
    'REPRESENTATIVES 3': 32,
    'REPRESENTATIVES 4': 33,
    'REPRESENTATIVE 1': 30,
    'REPRESENTATIVE 2': 31,
    'REPRESENTATIVE 3': 32,
    'REPRESENTATIVE 4': 33,
  };
  
  // Check for exact matches first
  if (positionRanks[normalizedTitle]) {
    return positionRanks[normalizedTitle];
  }
  
  // Check for partial matches for variations
  for (const [key, rank] of Object.entries(positionRanks)) {
    if (normalizedTitle.includes(key) || key.includes(normalizedTitle)) {
      return rank;
    }
  }
  
  // Default rank for unknown positions (will appear at the end)
  return 999;
};

export const VotingAnalyticsDialog = ({ open, onOpenChange, elections, preSelectedElection }: VotingAnalyticsDialogProps) => {
  const [analyticsData, setAnalyticsData] = useState<VotingAnalyticsData[]>([]);
  const [positionData, setPositionData] = useState<PositionAnalyticsData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedElection, setSelectedElection] = useState<string>('');
  const { isStaff, isAdmin, canViewResults } = usePermissions();

  const canViewAnalytics = isStaff || isAdmin || (selectedElection && elections.some(e => {
    const election = elections.find(el => el.election_id === selectedElection);
    return election && canViewResults('Completed', true);
  }));

  useEffect(() => {
    if (open) {
      if (preSelectedElection) {
        setSelectedElection(preSelectedElection);
      }
      if (canViewAnalytics) {
        fetchAnalytics();
      }
    }
  }, [open, canViewAnalytics, preSelectedElection]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch both course/gender analytics and position analytics with demographics
      const [analyticsResponse, positionResponse] = await Promise.all([
        supabase.rpc('get_voting_analytics_by_unique_voters'),
        supabase.rpc('get_position_analytics_with_demographics')
      ]);
      
      if (analyticsResponse.error) {
        console.error('Error fetching analytics:', analyticsResponse.error);
        return;
      }
      
      if (positionResponse.error) {
        console.error('Error fetching position analytics:', positionResponse.error);
        return;
      }
      
      setAnalyticsData(analyticsResponse.data || []);
      setPositionData(positionResponse.data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canViewAnalytics) {
    return null;
  }

  // Filter data for selected election only
  const filteredData = analyticsData.filter(item => {
    return selectedElection && item.election_id === selectedElection;
  });

  // Aggregate data for displays - now using unique voters instead of vote counts
  const courseVotingData = Object.entries(
    filteredData.reduce((acc, item) => {
      if (!acc[item.course]) {
        acc[item.course] = { course: item.course, Male: 0, Female: 0, total: 0 };
      }
      acc[item.course][item.gender as keyof typeof acc[string]] += item.unique_voters;
      acc[item.course].total += item.unique_voters;
      return acc;
    }, {} as Record<string, any>)
  ).map(([course, data]) => data).sort((a, b) => b.total - a.total);

  const genderDistribution = Object.entries(
    filteredData.reduce((acc, item) => {
      if (!acc[item.gender]) {
        acc[item.gender] = 0;
      }
      acc[item.gender] += item.unique_voters;
      return acc;
    }, {} as Record<string, number>)
  ).map(([gender, count]) => ({
    name: gender,
    value: count,
    color: GENDER_COLORS[gender as keyof typeof GENDER_COLORS] || '#6B7280'
  }));

  const totalVotes = genderDistribution.reduce((sum, item) => sum + item.value, 0);

  // Filter position data for selected election
  const filteredPositionData = positionData.filter(item => {
    return selectedElection && item.election_id === selectedElection;
  });

  // Group position data by position for analysis
  const positionAnalysisData = Object.entries(
    filteredPositionData.reduce((acc, item) => {
      const key = `${item.position_id}-${item.position_title}`;
      if (!acc[key]) {
        acc[key] = {
          position_id: item.position_id,
          position_title: item.position_title,
          total_voters: 0,
          total_eligible_voters: item.total_eligible_voters,
          course_breakdown: {},
          gender_breakdown: { Male: 0, Female: 0 },
          rank: getPositionRank(item.position_title)
        };
      }
      
      // Add to course breakdown
      if (!acc[key].course_breakdown[item.course]) {
        acc[key].course_breakdown[item.course] = { Male: 0, Female: 0, total: 0 };
      }
      acc[key].course_breakdown[item.course][item.gender] += item.unique_voters;
      acc[key].course_breakdown[item.course].total += item.unique_voters;
      
      // Add to gender breakdown
      acc[key].gender_breakdown[item.gender] += item.unique_voters;
      acc[key].total_voters += item.unique_voters;
      
      return acc;
    }, {} as Record<string, any>)
  ).map(([key, data]) => data).sort((a, b) => a.rank - b.rank);

  // Position engagement data for charts
  const positionEngagementData = positionAnalysisData.map(item => ({
    position: item.position_title,
    voters: item.total_voters,
    percentage: item.total_eligible_voters > 0 ? 
      ((item.total_voters / item.total_eligible_voters) * 100) : 0
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Voting Analytics Dashboard
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Election Selection */}
          <Card className="flex-shrink-0">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Select Election for Analysis</h3>
                <Select value={selectedElection} onValueChange={setSelectedElection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an election to analyze..." />
                  </SelectTrigger>
                  <SelectContent>
                    {elections.map((election) => (
                      <SelectItem key={election.election_id} value={election.election_id}>
                        {election.election_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-32 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : !selectedElection ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Please select an election to view analytics.</p>
              </CardContent>
            </Card>
          ) : filteredData.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No voting data available for the selected election.</p>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="course-breakdown" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="course-breakdown">Course Breakdown</TabsTrigger>
                <TabsTrigger value="gender-distribution">Gender Distribution</TabsTrigger>
                <TabsTrigger value="position-analysis">Position Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="course-breakdown" className="space-y-4">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Course Voting Trends
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={courseVotingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="course" 
                              angle={-45} 
                              textAnchor="end" 
                              height={100}
                              interval={0}
                              fontSize={12}
                            />
                            <YAxis />
                            <Tooltip 
                              formatter={(value, name) => [value, name === 'Male' ? 'Male Voters' : 'Female Voters']}
                              labelFormatter={(label) => `Course: ${label}`}
                            />
                            <Bar dataKey="Male" fill={GENDER_COLORS.Male} name="Male" />
                            <Bar dataKey="Female" fill={GENDER_COLORS.Female} name="Female" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Course Breakdown Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {courseVotingData.map((item, index) => (
                          <div key={index} className="space-y-2 p-3 border rounded-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-sm">{item.course}</h4>
                              <Badge variant="outline">{item.total} total voters</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: GENDER_COLORS.Male }} />
                                    Male
                                  </span>
                                   <span>{item.Male} voters</span>
                                </div>
                                <Progress 
                                  value={(item.Male / item.total) * 100} 
                                  className="h-2"
                                />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded" style={{ backgroundColor: GENDER_COLORS.Female }} />
                                    Female
                                  </span>
                                   <span>{item.Female} voters</span>
                                </div>
                                <Progress 
                                  value={(item.Female / item.total) * 100} 
                                  className="h-2"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="gender-distribution" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gender Distribution Chart</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={genderDistribution}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {genderDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [value, 'Voters']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Gender Distribution Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {genderDistribution.map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <Badge variant="outline">{item.value} voters</Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {((item.value / totalVotes) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                            <Progress 
                              value={(item.value / totalVotes) * 100} 
                              className="h-3"
                            />
                          </div>
                        ))}
                        
                        <div className="mt-6 pt-4 border-t space-y-3">
                          <h4 className="font-medium text-sm">Summary Statistics</h4>
                            <div className="grid grid-cols-1 gap-3 text-xs">
                             <div className="flex justify-between">
                               <span className="text-muted-foreground">Total Voters:</span>
                               <span className="font-bold">{totalVotes}</span>
                             </div>
                           </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

               <TabsContent value="position-analysis" className="space-y-4">
                {positionAnalysisData.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No voting data available for position analysis.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Position Engagement Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5" />
                          Position Engagement Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={positionEngagementData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis 
                                dataKey="position" 
                                angle={-45} 
                                textAnchor="end" 
                                height={80}
                                interval={0}
                                fontSize={12}
                              />
                              <YAxis />
                              <Tooltip 
                                formatter={(value) => [value, 'Total Voters']}
                                labelFormatter={(label) => `Position: ${label}`}
                              />
                              <Bar dataKey="voters" fill="#3B82F6" name="Voters" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Detailed Position Analysis */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Detailed Position Breakdown</h3>
                      {positionAnalysisData.map((position, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">{position.position_title}</CardTitle>
                              <Badge variant="outline">{position.total_voters} total voters</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              {/* Gender Breakdown */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Gender Distribution</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded" style={{ backgroundColor: GENDER_COLORS.Male }} />
                                      Male
                                    </div>
                                    <span>{position.gender_breakdown.Male} voters</span>
                                  </div>
                                  <Progress 
                                    value={position.total_voters > 0 ? (position.gender_breakdown.Male / position.total_voters) * 100 : 0} 
                                    className="h-2"
                                  />
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 rounded" style={{ backgroundColor: GENDER_COLORS.Female }} />
                                      Female
                                    </div>
                                    <span>{position.gender_breakdown.Female} voters</span>
                                  </div>
                                  <Progress 
                                    value={position.total_voters > 0 ? (position.gender_breakdown.Female / position.total_voters) * 100 : 0} 
                                    className="h-2"
                                  />
                                </div>
                              </div>

                              {/* Course Breakdown */}
                              <div className="space-y-3">
                                <h4 className="font-medium text-sm">Course Distribution</h4>
                                <div className="space-y-3 max-h-60 overflow-y-auto">
                                  {Object.entries(position.course_breakdown).map(([course, data]: [string, any], courseIndex) => (
                                    <div key={courseIndex} className="space-y-2 p-2 border rounded">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium">{course}</span>
                                        <Badge variant="outline" className="text-xs">{data.total} voters</Badge>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span>Male</span>
                                            <span>{data.Male}</span>
                                          </div>
                                          <Progress 
                                            value={data.total > 0 ? (data.Male / data.total) * 100 : 0} 
                                            className="h-1"
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs">
                                            <span>Female</span>
                                            <span>{data.Female}</span>
                                          </div>
                                          <Progress 
                                            value={data.total > 0 ? (data.Female / data.total) * 100 : 0} 
                                            className="h-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};