import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { DoctorProfile } from '@/components/doctor/types';

export const useProfilePhoto = () => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfilePhoto = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('[useProfilePhoto] No user found');
          return;
        }

        const { data: doctor, error } = await supabase
          .from('doctors')
          .select('profile_photo_url')
          .eq('user_id', user.id)
          .single<Pick<DoctorProfile, 'profile_photo_url'>>();

        if (error) {
          console.error('[useProfilePhoto] Error fetching profile photo:', error);
          return;
        }

        console.log('[useProfilePhoto] Profile photo fetched:', doctor?.profile_photo_url);
        setProfilePhotoUrl(doctor?.profile_photo_url ?? null);
      } catch (error) {
        console.error('[useProfilePhoto] Error:', error);
      }
    };

    fetchProfilePhoto();
  }, []);

  return profilePhotoUrl;
};