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

    if (!audioFile) {
      throw new Error('No audio file received from storage')
    }

    console.log('Successfully downloaded audio file, size:', audioFile.size)

    // Create form data for Whisper API
    const formData = new FormData()
    
    // Create a File object from the Blob with a proper filename
    const file = new File([audioFile], audioPath, { type: audioFile.type })
    formData.append('file', file)
    formData.append('model', 'whisper-1')
    formData.append('response_format', 'json')

    console.log('Sending request to Whisper API')

    // Send to Whisper API
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: formData,
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      console.error('Whisper API error:', error)
      throw new Error(`Failed to transcribe audio: ${error}`)
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