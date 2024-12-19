import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useProfilePhoto = () => {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: doctorProfile } = await supabase
          .from('doctors')
          .select('profile_photo_url')
          .eq('user_id', user.id)
          .maybeSingle();

        if (doctorProfile?.profile_photo_url) {
          setProfilePhotoUrl(doctorProfile.profile_photo_url);
        }
      } catch (error) {
        console.error('Error fetching doctor profile:', error);
      }
    };

    fetchDoctorProfile();
  }, []);

  return profilePhotoUrl;
};