import { env } from '../../config/env';

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export async function synthesize(text: string): Promise<Buffer> {
  const ssml = `<speak version="1.0" xml:lang="en-US"><voice xml:lang="en-US" xml:gender="Female" name="en-US-AriaNeural">${escapeXml(text)}</voice></speak>`;
  const response = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'FluencyAI',
    },
    body: ssml,
  });
  if (!response.ok) throw new Error(`Azure TTS: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
