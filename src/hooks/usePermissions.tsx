import { useAuth } from '@/hooks/useAuth';

export const usePermissions = () => {
  const { profile } = useAuth();

  const isVoter = profile?.role === 'Voter';
  const isStaff = profile?.role === 'Staff';
  const isAdmin = profile?.role === 'Administrator';

  // Voter permissions - Only voters can vote, NOT admins or staff
  const canVote = isVoter; // Only voters can vote
  const canViewCandidates = true; // All roles can view candidates
  const canViewElections = true; // All roles can view elections

  // Staff permissions
  const canViewVoterActivity = isStaff || isAdmin;
  const canApproveVoters = isStaff || isAdmin;
  const canGenerateReports = isStaff || isAdmin;
  const canViewVotingProgress = isStaff || isAdmin;

  // Admin permissions
  const canManageElections = isAdmin;
  const canManageCandidates = isAdmin;
  const canManageUsers = isAdmin;
  const canViewAuditLogs = isAdmin;
  const canManageSystemSettings = isAdmin;
  const canPublishResults = isAdmin;

  // Result viewing permissions - now with admin approval requirement
  const canViewResults = (electionStatus: string, showResultsToVoters: boolean = false) => {
    if (isAdmin || isStaff) return true; // Admin and staff can always view results
    return electionStatus === 'Completed' && showResultsToVoters; // Voters only if explicitly allowed
  };

  // Election visibility permissions
  const canViewElection = (electionStatus: string) => {
    if (isAdmin || isStaff) return true; // Admin and staff can view all elections
    return electionStatus === 'Active' || electionStatus === 'Upcoming'; // Voters only see active/upcoming
  };

  // Candidate visibility permissions
  const canViewCandidatesForElection = (electionStatus: string) => {
    if (isAdmin || isStaff) return true; // Admin and staff can view all candidates
    return electionStatus === 'Active' || electionStatus === 'Upcoming'; // Voters can't see candidates for completed elections
  };

  return {
    profile,
    isVoter,
    isStaff,
    isAdmin,
    canVote,
    canViewCandidates,
    canViewElections,
    canViewVoterActivity,
    canApproveVoters,
    canGenerateReports,
    canViewVotingProgress,
    canManageElections,
    canManageCandidates,
    canManageUsers,
    canViewAuditLogs,
    canManageSystemSettings,
    canPublishResults,
    canViewResults,
    canViewElection,
    canViewCandidatesForElection
  };
};