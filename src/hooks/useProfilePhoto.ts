import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DoctorProfile } from '@/components/doctor/types';

type DoctorProfileChanges = RealtimePostgresChangesPayload<{
  old: DoctorProfile | null;
  new: DoctorProfile | null;
}>;

export const useProfilePhoto = () => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        console.log('[useProfilePhoto] Fetching doctor profile...');
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[useProfilePhoto] No user found');
          return;
        }

        const { data: doctorProfile, error } = await supabase
          .from('doctors')
          .select('profile_photo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('[useProfilePhoto] Error fetching doctor profile:', error);
          return;
        }

        console.log('[useProfilePhoto] Doctor profile fetched:', doctorProfile);
        if (doctorProfile?.profile_photo_url) {
          setProfilePhotoUrl(doctorProfile.profile_photo_url);
        }
      } catch (error) {
        console.error('[useProfilePhoto] Error in fetchDoctorProfile:', error);
      }
    };

    fetchDoctorProfile();

    // Subscribe to realtime changes on the doctors table
    const channel = supabase
      .channel('doctors_profile_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors',
          filter: `user_id=eq.${supabase.auth.getUser().then(({ data }) => data.user?.id)}`
        },
        (payload: DoctorProfileChanges) => {
          console.log('[useProfilePhoto] Realtime update received:', payload);
          const newProfile = payload.new;
          if (newProfile && 'profile_photo_url' in newProfile) {
            setProfilePhotoUrl(newProfile.profile_photo_url);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  return profilePhotoUrl;
};