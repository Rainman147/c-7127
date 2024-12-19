import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import type { DoctorProfileFormData } from "./types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "use-debounce";

interface DoctorProfileFormProps {
  onSubmit: (data: DoctorProfileFormData) => void;
  isLoading: boolean;
  initialData?: Partial<DoctorProfileFormData>;
}

export function DoctorProfileForm({ onSubmit, isLoading, initialData }: DoctorProfileFormProps) {
  const { toast } = useToast();
  const form = useForm<DoctorProfileFormData>({
    defaultValues: {
      full_name: "",
      email: "",
      title: "",
      specialty: "",
      clinic_name: "",
      address: "",
      phone: "",
      license_number: "",
      business_hours: {
        monday: { open: "09:00", close: "17:00" },
        tuesday: { open: "09:00", close: "17:00" },
        wednesday: { open: "09:00", close: "17:00" },
        thursday: { open: "09:00", close: "17:00" },
        friday: { open: "09:00", close: "17:00" },
        saturday: null,
        sunday: null,
      },
    },
  });

  // Load initial data when provided
  useEffect(() => {
    if (initialData) {
      console.log("[DoctorProfileForm] Setting initial form data:", initialData);
      Object.entries(initialData).forEach(([key, value]) => {
        form.setValue(key as keyof DoctorProfileFormData, value);
      });
    }
  }, [initialData, form]);

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback(async (data: DoctorProfileFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { error } = await supabase
        .from("doctors")
        .upsert({
          user_id: user.id,
          ...data
        });

      if (error) throw error;

      toast({
        title: "Changes saved",
        description: "Your profile has been updated automatically.",
      });
    } catch (error) {
      console.error("Error auto-saving profile:", error);
      toast({
        title: "Error saving changes",
        description: "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  }, 1000);

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      debouncedSave(data as DoctorProfileFormData);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, debouncedSave]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Doe" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="doctor@clinic.com" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Dr." {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialty</FormLabel>
              <FormControl>
                <Input placeholder="Cardiology" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="clinic_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clinic Name</FormLabel>
              <FormControl>
                <Input placeholder="Heart Care Clinic" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Medical Center Dr" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="(555) 123-4567" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="license_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>License Number</FormLabel>
              <FormControl>
                <Input placeholder="MD12345" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
}