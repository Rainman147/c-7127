import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProfilePhotoUploadProps {
  profilePhotoUrl: string | null;
  onPhotoUpload: (url: string) => void;
  isLoading: boolean;
}

export function ProfilePhotoUpload({ profilePhotoUrl, onPhotoUpload, isLoading }: ProfilePhotoUploadProps) {
  const { toast } = useToast();

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("No user found");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from("doctor_profiles")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("doctor_profiles")
        .getPublicUrl(filePath);

      onPhotoUpload(publicUrl);
      toast({
        title: "Photo uploaded successfully",
        description: "Your profile photo has been updated.",
      });
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error uploading photo",
        description: "There was a problem uploading your photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={profilePhotoUrl || ""} />
          <AvatarFallback>
            <User2 className="h-12 w-12" />
          </AvatarFallback>
        </Avatar>
        <label 
          htmlFor="photo-upload" 
          className="absolute bottom-0 right-0 p-1 bg-chatgpt-hover rounded-full cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <input
            id="photo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
            disabled={isLoading}
          />
        </label>
      </div>
    </div>
  );
}