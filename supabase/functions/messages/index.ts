import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    const { content, type = 'text', sessionId } = await req.json()

    console.log('[messages] Processing message:', { 
      userId: user.id,
      sessionId,
      type,
      contentLength: content.length 
    })

    // Save message to database
    const { data: message, error: insertError } = await supabaseClient
      .from('messages')
      .insert({
        chat_id: sessionId,
        content,
        sender: 'user',
        type,
        status: 'delivered'
      })
      .select()
      .single()

    if (insertError) {
      console.error('[messages] Error inserting message:', insertError)
      throw insertError
    }

    console.log('[messages] Message saved successfully:', message.id)

    return new Response(
      JSON.stringify(message),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        } 
      }
    )

  } catch (error) {
    console.error('[messages] Error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})