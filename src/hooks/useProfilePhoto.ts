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
          table: 'doctors'
        },
        (payload: DoctorProfileChanges) => {
          console.log('[useProfilePhoto] Realtime update received:', payload);
          if (payload.new && 'profile_photo_url' in payload.new) {
            const newUrl = payload.new.profile_photo_url;
            // Ensure newUrl is of type string | null before setting state
            if (typeof newUrl === 'string' || newUrl === null) {
              console.log('[useProfilePhoto] Setting new profile photo URL:', newUrl);
              setProfilePhotoUrl(newUrl);
            } else {
              console.warn('[useProfilePhoto] Received invalid profile_photo_url type:', typeof newUrl);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useProfilePhoto] Subscription status:', status);
      });

    return () => {
      console.log('[useProfilePhoto] Cleaning up subscription');
      channel.unsubscribe();
    };
  }, []);

  return profilePhotoUrl;
};