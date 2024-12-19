import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { DoctorProfile } from '@/components/doctor/types';

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
          .maybeSingle<Pick<DoctorProfile, 'profile_photo_url'>>();

        if (error) {
          console.error('[useProfilePhoto] Error fetching doctor profile:', error);
          return;
        }

        console.log('[useProfilePhoto] Doctor profile fetched:', doctorProfile);
        setProfilePhotoUrl(doctorProfile?.profile_photo_url ?? null);
      } catch (error) {
        console.error('[useProfilePhoto] Error in fetchDoctorProfile:', error);
      }
    };

    fetchDoctorProfile();

    const channel = supabase
      .channel('doctors_profile_changes')
      .on<DoctorProfile>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'doctors'
        },
        (payload: RealtimePostgresChangesPayload<DoctorProfile>) => {
          console.log('[useProfilePhoto] Realtime update received:', payload);
          if (payload.new) {
            setProfilePhotoUrl(payload.new.profile_photo_url);
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