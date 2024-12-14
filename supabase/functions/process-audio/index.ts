import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { audioPath } = await req.json()
    console.log('Processing audio file:', audioPath)

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl!, supabaseKey!)

    // Download the audio file from storage
    const { data: audioFile, error: downloadError } = await supabase
      .storage
      .from('audio_files')
      .download(audioPath)

    if (downloadError) {
      console.error('Error downloading audio file:', downloadError)
      throw new Error('Failed to download audio file')
    }

    // Convert audio file to base64
    const audioBuffer = await audioFile.arrayBuffer()
    const audioBase64 = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    )

    // Send to Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'multipart/form-data',
      },
      body: JSON.stringify({
        file: audioBase64,
        model: 'whisper-1',
        response_format: 'json',
      }),
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      console.error('Whisper API error:', error)
      throw new Error('Failed to transcribe audio')
    }

    const transcription = await whisperResponse.json()
    console.log('Transcription completed successfully')

    // Clean up - delete the audio file
    const { error: deleteError } = await supabase
      .storage
      .from('audio_files')
      .remove([audioPath])

    if (deleteError) {
      console.error('Error deleting audio file:', deleteError)
    }

    return new Response(
      JSON.stringify({ transcription: transcription.text }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error processing audio:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})