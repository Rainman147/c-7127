import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

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
    const { audioPath } = await req.json()
    console.log('Received request to transcribe:', audioPath)

    if (!audioPath) {
      throw new Error('No audio path provided')
    }

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Download the file from storage
    const { data: audioData, error: downloadError } = await supabaseAdmin
      .storage
      .from('audio_files')
      .download(audioPath)

    if (downloadError) {
      console.error('Error downloading audio:', downloadError)
      throw new Error('Failed to download audio file')
    }

    if (!audioData) {
      throw new Error('No audio data received')
    }

    console.log('Downloaded audio file:', { size: audioData.size })

    // Create form data for OpenAI API
    const formData = new FormData()
    formData.append('file', audioData, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')
    formData.append('response_format', 'json')

    // Send to Whisper API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Whisper API error:', error)
      throw new Error(`Whisper API error: ${response.status} ${error}`)
    }

    const result = await response.json()
    console.log('Transcription completed successfully')

    // Clean up the audio file
    const { error: deleteError } = await supabaseAdmin
      .storage
      .from('audio_files')
      .remove([audioPath])

    if (deleteError) {
      console.error('Error deleting audio file:', deleteError)
    }

    return new Response(
      JSON.stringify({ transcription: result.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})