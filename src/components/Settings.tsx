import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SecureImage } from '@/components/ui/SecureImage';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserHistory } from '@/hooks/useUserHistory';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfileUpdateRequests } from '@/hooks/useProfileUpdateRequests';
import {
  Shield,
  User,
  Key,
  History,
  Calendar,
  Eye,
  Settings as SettingsIcon,
  MapPin,
  Monitor,
  Clock,
  LogIn,
  LogOut,
  Lock,
  Save,
  Edit,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SecuritySettings } from './SecuritySettings';
import { StepUpVerification } from './StepUpVerification';
import { ChangePasswordDialog } from './ChangePasswordDialog';

// Fully updated, mobile-first responsive version of Settings
export const Settings = () => {
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { isVoter } = usePermissions();
  const { userHistory, loading: historyLoading, error: historyError } = useUserHistory();
  const { submitUpdateRequest } = useProfileUpdateRequests();

  const [loading, setLoading] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [updateProfileDialogOpen, setUpdateProfileDialogOpen] = useState(false);
  const [locationCache, setLocationCache] = useState<Record<string, string>>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState<Record<string, boolean>>({});
  const [profileData, setProfileData] = useState({
    email: profile?.email || '',
    year_level: profile?.year_level || '',
  });

  // Helper: parse browser + OS from user agent
  const parseBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown' };
    let browser = 'Unknown';
    let os = 'Unknown';

    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';

    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS')) os = 'iOS';

    return { browser, os };
  };

  // Helper: IP -> location with fallbacks + timeout + caching
  const getLocationFromIP = async (ip: string): Promise<string> => {
    if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'Local Network';
    }

    const apis = [
      {
        url: `https://ipwhois.app/json/${ip}`,
        parser: (data: any) => (data.city && data.country ? `${data.city}, ${data.country}` : data.country || 'Unknown'),
      },
      {
        url: `https://api.country.is/${ip}`,
        parser: (data: any) => data.country || 'Unknown',
      },
      {
        url: `https://ipapi.co/${ip}/json/`,
        parser: (data: any) => {
          if (data.city && data.country_name) return `${data.city}, ${data.country_name}`;
          if (data.country_name) return data.country_name;
          return 'Unknown';
        },
      },
    ];

    for (const api of apis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(api.url, { signal: controller.signal, cache: 'force-cache' });
        clearTimeout(timeoutId);
        if (!response.ok) continue;
        const data = await response.json();
        const location = api.parser(data);
        if (location !== 'Unknown') return location;
      } catch (e) {
        console.warn(`Location API failed for ${api.url}:`, e);
        continue;
      }
    }
    return 'Unknown';
  };

  // Load geos for last ~50 rows, cap unique IPs at 10 to avoid rate limits
  useEffect(() => {
    const loadLocations = async () => {
      const recent = userHistory.slice(0, 50);
      const ipsToLoad = recent
        .filter((e) => e.ip_address && !locationCache[e.ip_address!])
        .map((e) => e.ip_address!)
        .filter((ip, i, arr) => arr.indexOf(ip) === i)
        .slice(0, 10);

      for (let i = 0; i < ipsToLoad.length; i++) {
        const ip = ipsToLoad[i];
        if (!isLoadingLocation[ip]) {
          setIsLoadingLocation((prev) => ({ ...prev, [ip]: true }));
          try {
            if (i > 0) await new Promise((r) => setTimeout(r, 1000));
            const location = await getLocationFromIP(ip);
            setLocationCache((prev) => ({ ...prev, [ip]: location }));
          } catch (err) {
            console.warn(`Failed to load location for IP ${ip}:`, err);
            setLocationCache((prev) => ({ ...prev, [ip]: 'Unknown' }));
          } finally {
            setIsLoadingLocation((prev) => ({ ...prev, [ip]: false }));
          }
        }
      }
    };

    if (userHistory.length > 0) loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userHistory]);

  // Profile update flow
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      if (profile?.role === 'Staff' || profile?.role === 'Administrator') {
        const { data, error } = await supabase.rpc('admin_staff_profile_update', {
          p_email: profileData.email,
          p_year_level: profileData.year_level,
        });
        if (error) {
          toast({ title: 'Error', description: error.message || 'Failed to update profile', variant: 'destructive' });
        } else if (data && typeof data === 'object' && 'success' in data && (data as any).success === false) {
          toast({ title: 'No Changes', description: (data as any)?.error || 'No changes detected' });
        } else {
          toast({ title: 'Success', description: 'Profile and authentication email updated successfully.' });
          setUpdateProfileDialogOpen(false);
        }
      } else {
        const success = await submitUpdateRequest({ email: profileData.email, year_level: profileData.year_level });
        if (success) {
          setProfileData({ email: profile?.email || '', year_level: profile?.year_level || '' });
          setUpdateProfileDialogOpen(false);
        }
      }
    } catch (e) {
      console.error('Profile update failed:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifiedProfileUpdate = () => handleProfileUpdate();

  // UI helpers
  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-600" />;
      case 'cast_vote':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'profile_update_request':
        return <User className="h-4 w-4 text-orange-600" />;
      case 'submit_appeal':
        return <User className="h-4 w-4 text-purple-600" />;
      case 'approve_user_registration':
        return <Shield className="h-4 w-4 text-green-600" />;
      case 'reject_user_registration':
        return <Shield className="h-4 w-4 text-red-600" />;
      case 'approve_profile_update':
        return <User className="h-4 w-4 text-green-600" />;
      case 'reject_profile_update':
        return <User className="h-4 w-4 text-red-600" />;
      default:
        return <History className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6 pb-4 lg:pb-0">
      <div className="flex items-center justify-between">
        {/* Optional header actions can go here if needed later */}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        {/* (Optional) TabsList if you later add more tabs */}
        {/*
        <TabsList className="w-full grid grid-cols-2 sm:inline-flex">
          <TabsTrigger value="profile" className="w-full">Profile</TabsTrigger>
          <TabsTrigger value="security" className="w-full">Security</TabsTrigger>
        </TabsList>
        */}

        <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:gap-6 lg:grid-cols-3">
            {/* Profile Overview Card */}
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Profile Image Display */}
                {profile?.id_image_url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ID Image</Label>
                    <div className="relative w-full max-w-sm mx-auto">
                      <SecureImage
                        bucket="student-ids"
                        path={profile.id_image_url}
                        alt="ID Image"
                        className="w-full aspect-[4/3] object-cover rounded-lg border"
                        showError={true}
                      />

                      <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        Uploaded ID
                      </div>

                      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
                        <DialogTrigger asChild>
                        <Button size="sm" variant="secondary" className="absolute top-1 right-1 lg:top-2 lg:right-2 bg-black/70 hover:bg-black/80 text-white border-none h-8 w-8 lg:h-10 lg:w-10 p-0 flex items-center justify-center rounded-full"> <Eye className="h-3 w-3 lg:h-4 lg:w-4" /> </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto">
                          <DialogHeader>
                            <DialogTitle>ID Image - Full Size</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <SecureImage
                              bucket="student-ids"
                              path={profile.id_image_url}
                              alt="ID Image Full Size"
                              className="max-w-full max-h-[70vh] object-contain rounded-lg"
                              showError={true}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <p className="font-medium break-words">{profile?.full_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                    <p className="font-medium break-words">{profile?.student_id || 'Not provided'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <p className="capitalize font-medium">{profile?.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Registration Status</Label>
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        profile?.registration_status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : profile?.registration_status === 'Pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {profile?.registration_status}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information / Update */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.full_name || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Student ID</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.student_id || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Course</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.course || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.email || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Year Level</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.year_level || 'Not provided'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                      <p className="font-medium p-2 bg-muted rounded break-words">
                        {profile?.gender || 'Not provided'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Dialog open={updateProfileDialogOpen} onOpenChange={setUpdateProfileDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto flex items-center gap-2">
                          <Edit className="h-4 w-4" />
                            Update Profile
                          </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] sm:max-w-md" aria-describedby="update-profile-description">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Update Profile Information
                          </DialogTitle>
                          <DialogDescription id="update-profile-description">
                            Update your email address and year level information.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                          {profile?.role === 'Voter' && (
                            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Profile updates require staff approval. Only email address and year level can be updated.
                              </p>
                            </div>
                          )}

                          {(profile?.role === 'Staff' || profile?.role === 'Administrator') && (
                            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm text-green-800">
                                <strong>Note:</strong> As a {profile.role}, you can update your profile directly without approval.
                              </p>
                            </div>
                          )}

                          <form className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="dialog-email">
                                Email Address <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="dialog-email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) =>
                                  setProfileData((prev) => ({ ...prev, email: e.target.value }))
                                }
                                placeholder="Enter your email address"
                                disabled={loading}
                                inputMode="email"
                                autoComplete="email"
                              />
                              {profile?.role === 'Voter' && (
                                <p className="text-xs text-muted-foreground">Changes require staff approval</p>
                              )}
                            </div>

                            {/* Only show year level field for Voters */}
                            {profile?.role === 'Voter' ? (
                              <div className="space-y-2">
                                <Label htmlFor="dialog-year-level">
                                  Year Level <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                  value={profileData.year_level || ''}
                                  onValueChange={(value) =>
                                    setProfileData((prev) => ({ ...prev, year_level: value }))
                                  }
                                  disabled={loading}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue
                                      placeholder={
                                        profileData.year_level ? profileData.year_level : 'Select your year level'
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent className="bg-popover border border-border shadow-md z-50">
                                    <SelectItem value="1st Year">1st Year</SelectItem>
                                    <SelectItem value="2nd Year">2nd Year</SelectItem>
                                    <SelectItem value="3rd Year">3rd Year</SelectItem>
                                    <SelectItem value="4th Year">4th Year</SelectItem>
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Changes require staff approval</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">
                                  Year Level (Read-only for {profile?.role})
                                </Label>
                                <p className="font-medium p-2 bg-muted rounded">
                                  {profile?.year_level || 'Not provided'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Year level cannot be modified for Staff and Administrator accounts
                                </p>
                              </div>
                            )}
                          </form>

                          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2 sm:pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setUpdateProfileDialogOpen(false)}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <StepUpVerification
                              onVerified={handleVerifiedProfileUpdate}
                              actionType="update_profile"
                              title="Verify Identity"
                              description="Please verify your identity to update your profile information."
                            >
                              <Button
                                disabled={
                                  !profileData.email || (profile?.role === 'Voter' && !profileData.year_level) || loading
                                }
                                className="w-full sm:w-auto min-w-[140px]"
                              >
                                {loading
                                  ? profile?.role === 'Voter'
                                    ? 'Submitting...'
                                    : 'Updating...'
                                  : profile?.role === 'Voter'
                                  ? 'Submit Request'
                                  : 'Update Profile'}
                              </Button>
                            </StepUpVerification>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:gap-6">
            {/* Password Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Change Password
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Secure your account by updating your password regularly. You'll be signed out of all devices after
                    changing your password.
                  </p>

                  <ChangePasswordDialog>
                    <Button className="w-full sm:w-auto flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Change Password
                    </Button>
                  </ChangePasswordDialog>
                </div>
              </CardContent>
            </Card>

            {/* User History - Only for voters */}
            {isVoter && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  ) : historyError ? (
                    <div className="text-center py-8 text-destructive">
                      <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>Error loading activity history</p>
                      <p className="text-sm break-words">{historyError}</p>
                    </div>
                  ) : userHistory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                      <p>No activity history found.</p>
                      <p className="text-sm">Your actions will appear here as you use the system.</p>
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-1">
                      {userHistory.slice(0, 20).map((entry) => {
                        const browserInfo = parseBrowserInfo(entry.user_agent);
                        const isAuthAction = ['login', 'logout'].includes(entry.action);
                        return (
                          <div
                            key={entry.id}
                            className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="mt-0.5 flex-shrink-0">{getActivityIcon(entry.action)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-medium text-sm truncate">{entry.description}</h4>
                                    <Badge
                                      variant={isAuthAction ? 'secondary' : 'outline'}
                                      className="text-xs flex-shrink-0"
                                    >
                                      {entry.action}
                                    </Badge>
                                  </div>

                                  {/* Compact details for login/logout */}
                                  {isAuthAction && (
                                    <div className="space-y-1 text-xs text-muted-foreground mt-1">
                                      {entry.ip_address && (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <MapPin className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">
                                            <span className="font-medium">IP:</span> {entry.ip_address}
                                            {locationCache[entry.ip_address] && ` • ${locationCache[entry.ip_address]}`}
                                            {isLoadingLocation[entry.ip_address] && ' • Loading location...'}
                                          </span>
                                        </div>
                                      )}
                                      {entry.user_agent && (
                                        <div className="flex items-center gap-1 min-w-0">
                                          <Monitor className="h-3 w-3 flex-shrink-0" />
                                          <span className="truncate">
                                            <span className="font-medium">Device:</span> {browserInfo.browser} on {browserInfo.os}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Compact details for other actions */}
                                  {!isAuthAction && entry.resource_type && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate">
                                      <span className="font-medium">Resource:</span> {entry.resource_type}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock className="h-3 w-3" />
                                <div className="text-right">
                                  <div>{new Date(entry.timestamp).toLocaleDateString()}</div>
                                  <div className="text-[10px] opacity-75">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Security Settings for Staff/Admin */}
            <SecuritySettings />

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Account Role</Label>
                    <p className="capitalize font-medium">{profile?.role}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                    <p className="font-medium">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                    <p className="font-medium">
                      {profile?.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecuritySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};
