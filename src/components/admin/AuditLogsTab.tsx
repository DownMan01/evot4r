import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { FileText, User, Vote, UserCheck, Shield, CheckCircle, Info, Calendar, MapPin, Monitor, Smartphone, Search, Filter, ChevronDown } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  timestamp: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  actor_id: string | null;
  actor_role: string | null;
  actor_profile?: {
    full_name: string;
    student_id: string;
    email: string;
    role: string;
    course: string;
    year_level: string;
  } | null;
}

interface AuditLogsTabProps {
  auditLogs: AuditLogEntry[];
  loading: boolean;
  error: string | null;
}

export const AuditLogsTab = ({ auditLogs, loading, error }: AuditLogsTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 20;

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login': return <User className="h-4 w-4 text-green-600" />;
      case 'logout': return <User className="h-4 w-4 text-red-600" />;
      case 'cast_vote': return <Vote className="h-4 w-4 text-blue-600" />;
      case 'approve_user_registration': 
      case 'reject_user_registration': 
        return <UserCheck className="h-4 w-4 text-purple-600" />;
      case 'update_user_role': return <Shield className="h-4 w-4 text-orange-600" />;
      case 'approve_action':
      case 'reject_action':
        return <CheckCircle className="h-4 w-4 text-indigo-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'login': return 'border-l-green-500 bg-green-50/50';
      case 'logout': return 'border-l-red-500 bg-red-50/50';
      case 'cast_vote': return 'border-l-blue-500 bg-blue-50/50';
      case 'approve_user_registration': return 'border-l-green-500 bg-green-50/50';
      case 'reject_user_registration': return 'border-l-red-500 bg-red-50/50';
      case 'update_user_role': return 'border-l-orange-500 bg-orange-50/50';
      case 'approve_action': return 'border-l-green-500 bg-green-50/50';
      case 'reject_action': return 'border-l-red-500 bg-red-50/50';
      default: return 'border-l-gray-500 bg-gray-50/50';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Administrator': return 'bg-purple-500';
      case 'Staff': return 'bg-blue-500';
      case 'Voter': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Get unique actions for filter
  const uniqueActions = ['All', ...Array.from(new Set(auditLogs.map(log => log.action)))];

  // Filter logs
  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor_profile?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    
    return matchesSearch && matchesAction;
  });

  // Paginate logs
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2 mb-1" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Trail ({filteredLogs.length} records)
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
        
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded border">
            Error loading audit logs: {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {showFilters && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div>
                <label className="text-sm font-medium mb-2 block">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>
                      {action === 'All' ? 'All Actions' : action.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {paginatedLogs.map(log => (
            <div key={log.id} className={`p-4 border rounded-lg border-l-4 ${getActionColor(log.action)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActionIcon(log.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-semibold text-foreground">
                      {log.description}
                    </h4>
                    {log.resource_type && (
                      <Badge variant="outline" className="text-xs">
                        {log.resource_type}
                      </Badge>
                    )}
                    {log.actor_role && (
                      <Badge className={`text-xs ${getRoleColor(log.actor_role)} text-white`}>
                        {log.actor_role}
                      </Badge>
                    )}
                  </div>

                  {/* Actor Information */}
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-medium">
                        {log.actor_profile?.full_name || 'System'}
                      </span>
                      {log.actor_profile?.student_id && (
                        <span className="text-xs">({log.actor_profile.student_id})</span>
                      )}
                    </div>
                    {log.actor_profile?.email && (
                      <span className="text-xs truncate">{log.actor_profile.email}</span>
                    )}
                  </div>

                  {/* Timestamp and Technical Details */}
                  <div className="flex flex-wrap items-center gap-4 mb-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    {log.ip_address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>IP: {log.ip_address}</span>
                      </div>
                    )}
                    {log.user_agent && (
                      <div className="flex items-center gap-1">
                        {log.user_agent.includes('Mobile') ? 
                          <Smartphone className="h-3 w-3" /> : 
                          <Monitor className="h-3 w-3" />
                        }
                        <span className="truncate max-w-xs">
                          {log.user_agent.includes('Chrome') ? 'Chrome' :
                           log.user_agent.includes('Firefox') ? 'Firefox' :
                           log.user_agent.includes('Safari') ? 'Safari' :
                           log.user_agent.includes('Edge') ? 'Edge' : 'Other'}
                        </span>
                      </div>
                    )}
                    {log.resource_id && (
                      <div className="flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        <span>ID: {log.resource_id.slice(0, 8)}...</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Profile Information */}
                  {log.actor_profile && (log.actor_profile.course || log.actor_profile.year_level) && (
                    <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                      {log.actor_profile.course && (
                        <span>Course: {log.actor_profile.course}</span>
                      )}
                      {log.actor_profile.year_level && (
                        <span>Year: {log.actor_profile.year_level}</span>
                      )}
                    </div>
                  )}

                  {/* Details Section */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        View detailed information
                      </summary>
                      <div className="mt-2 p-3 bg-muted/30 rounded text-xs max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                {searchTerm || actionFilter !== 'All' 
                  ? 'No logs match your search criteria.' 
                  : 'System activity will appear here as users interact with the platform.'
                }
              </p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
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
        
        {filteredLogs.length > logsPerPage && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * logsPerPage) + 1} to {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};