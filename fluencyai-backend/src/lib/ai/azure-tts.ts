import { env } from '../../config/env';

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export const isAzureConfigured = () => Boolean(env.AZURE_SPEECH_KEY && env.AZURE_SPEECH_REGION);

// Azure AI Speech (REST). A chave e a região precisam ser do mesmo recurso no portal.
export async function synthesize(text: string): Promise<Buffer> {
  if (!isAzureConfigured()) throw new Error('Azure TTS não configurado');
  const voice = env.AZURE_SPEECH_VOICE;
  const lang = voice.split('-').slice(0, 2).join('-');
  const ssml = `<speak version="1.0" xml:lang="${lang}"><voice name="${escapeXml(voice)}">${escapeXml(text)}</voice></speak>`;

  const response = await fetch(`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY!,
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'FluencyAI',
    },
    body: ssml,
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Azure TTS: ${response.status} ${await response.text().catch(() => '')}`);
  return Buffer.from(await response.arrayBuffer());
}
