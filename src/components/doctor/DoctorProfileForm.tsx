import { useEffect } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useForm } from "react-hook-form";
import type { DoctorProfileFormData } from "./types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDebouncedCallback } from "use-debounce";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface DoctorProfileFormProps {
  onSuccess: () => void;
}

const formSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  title: z.string().min(1, "Title is required"),
  specialty: z.string().min(1, "Specialty is required"),
  clinic_name: z.string().min(1, "Clinic name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  license_number: z.string().min(1, "License number is required"),
  business_hours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).nullable(),
    tuesday: z.object({ open: z.string(), close: z.string() }).nullable(),
    wednesday: z.object({ open: z.string(), close: z.string() }).nullable(),
    thursday: z.object({ open: z.string(), close: z.string() }).nullable(),
    friday: z.object({ open: z.string(), close: z.string() }).nullable(),
    saturday: z.object({ open: z.string(), close: z.string() }).nullable(),
    sunday: z.object({ open: z.string(), close: z.string() }).nullable(),
  })
});

export function DoctorProfileForm({ onSuccess }: DoctorProfileFormProps) {
  const { toast } = useToast();
  const form = useForm<DoctorProfileFormData>({
    resolver: zodResolver(formSchema),
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

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) return;

        const { data: profile, error } = await supabase
          .from("doctors")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (profile) {
          form.reset(profile);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, [form]);

  // Debounced auto-save function
  const debouncedSave = useDebouncedCallback(async (data: DoctorProfileFormData) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save your profile.",
          variant: "destructive",
        });
        return;
      }

      console.log("Saving profile data:", { ...data, user_id: user.id });

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
    } catch (error: any) {
      console.error("Error auto-saving profile:", error);
      toast({
        title: "Error saving changes",
        description: error.message || "There was a problem saving your changes. Please try again.",
        variant: "destructive",
      });
    }
  }, 1000);

  // Watch for form changes and trigger auto-save
  useEffect(() => {
    const subscription = form.watch((data) => {
      if (form.formState.isValid) {
        debouncedSave(data as DoctorProfileFormData);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, debouncedSave, form.formState.isValid]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSuccess)} className="space-y-4">
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Doe" {...field} />
              </FormControl>
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
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
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Save Profile</Button>
        </div>
      </form>
    </Form>
  );
}