import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfilePhotoUpload } from "./doctor/ProfilePhotoUpload";
import { DoctorProfileForm } from "./doctor/DoctorProfileForm";
import type { DoctorProfileFormData } from "./doctor/types";

interface DoctorProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DoctorProfileDialog({ open, onOpenChange }: DoctorProfileDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Partial<DoctorProfileFormData> | null>(null);

  // Fetch existing profile data when dialog opens
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data: doctorProfile, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        console.log("[DoctorProfileDialog] Fetched profile data:", doctorProfile);
        
        if (doctorProfile) {
          setProfileData(doctorProfile);
          setProfilePhotoUrl(doctorProfile.profile_photo_url);
        }
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
        toast({
          title: "Error loading profile",
          description: "There was a problem loading your profile data. Please try again.",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchDoctorProfile();
    }
  }, [open, toast]);

  const onSubmit = async (data: DoctorProfileFormData) => {
    try {
      setIsLoading(true);
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("No user found");

      console.log("[DoctorProfileDialog] Submitting with photo URL:", profilePhotoUrl);

      const doctorData = {
        user_id: user.id,
        full_name: data.full_name,
        email: data.email,
        title: data.title,
        specialty: data.specialty,
        clinic_name: data.clinic_name,
        address: data.address,
        phone: data.phone,
        license_number: data.license_number,
        profile_photo_url: profilePhotoUrl,
        business_hours: data.business_hours
      };

      const { error, data: result } = await supabase
        .from("doctors")
        .upsert(doctorData)
        .select()
        .single();

      if (error) throw error;

      console.log("[DoctorProfileDialog] Profile updated successfully:", result);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "There was a problem updating your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-chatgpt-main border-chatgpt-border">
        <DialogHeader>
          <DialogTitle>Doctor Profile</DialogTitle>
        </DialogHeader>
        
        <ProfilePhotoUpload 
          profilePhotoUrl={profilePhotoUrl}
          onPhotoUpload={setProfilePhotoUrl}
          isLoading={isLoading}
        />

        <DoctorProfileForm 
          onSubmit={onSubmit}
          isLoading={isLoading}
          initialData={profileData}
        />
      </DialogContent>
    </Dialog>
  );
}