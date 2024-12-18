import { serve } from 'https://deno.fresh.dev/std@v9.6.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportPayload {
  patientId?: string;
  chatId?: string;
  ehrSystem: string;
  data: {
    type: 'SOAP' | 'Summary' | 'Referral';
    content: Record<string, unknown>;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Parse the request body
    const payload: ExportPayload = await req.json();
    console.log('[export-to-ehr] Processing export request:', {
      userId: user.id,
      ehrSystem: payload.ehrSystem,
      dataType: payload.data.type
    });

    // Create export record
    const { data: exportRecord, error: exportError } = await supabaseClient
      .from('ehr_exports')
      .insert({
        user_id: user.id,
        patient_id: payload.patientId,
        chat_id: payload.chatId,
        ehr_system: payload.ehrSystem,
        export_data: payload.data,
        status: 'completed' // For now, we'll mark it as completed immediately
      })
      .select()
      .single();

    if (exportError) {
      throw exportError;
    }

    console.log('[export-to-ehr] Export completed successfully:', {
      exportId: exportRecord.id,
      userId: user.id
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: exportRecord
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('[export-to-ehr] Error processing export:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});