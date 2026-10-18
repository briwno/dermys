// Upload only the generated demonstration assets; never overwrite existing files.
const fs = require('node:fs');
const path = require('node:path');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const root = path.resolve(__dirname, '..');
  process.loadEnvFile(path.join(root, '.env'));
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  if (new URL(url).hostname !== 'iklbyztvjvxfhgupmkvw.supabase.co') {
    throw new Error('O projeto configurado não é o Dermys esperado.');
  }
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const folder = path.join(root, 'assets', 'demo', 'tattoos');
  const manifest = JSON.parse(fs.readFileSync(path.join(folder, 'manifest.json'), 'utf8'));
  const requested = process.argv.slice(2);
  if (requested.some(file => !manifest.some(item => item.file === file))) {
    throw new Error('Selecione somente arquivos presentes no manifesto.');
  }
  const selected = requested.length ? manifest.filter(item => requested.includes(item.file)) : manifest;
  for (const item of selected) {
    const bytes = fs.readFileSync(path.join(folder, item.file));
    const { data: existing, error: listError } = await client.storage.from('portfolios')
      .list('demo/generated-v1', { search: item.file });
    if (listError) throw listError;
    if (!existing.some(file => file.name === item.file)) {
      const { error } = await client.storage.from('portfolios').upload(
        `demo/generated-v1/${item.file}`, bytes,
        { contentType: 'image/png', cacheControl: '31536000', upsert: false }
      );
      if (error) throw error;
    }
    const { data } = client.storage.from('portfolios').getPublicUrl(`demo/generated-v1/${item.file}`);
    const response = await fetch(data.publicUrl);
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) {
      throw new Error(`Imagem pública indisponível: ${item.file} (${response.status})`);
    }
    const downloaded = Buffer.from(await response.arrayBuffer());
    if (!bytes.equals(downloaded)) throw new Error(`Conteúdo divergente: ${item.file}`);
    console.log(JSON.stringify({ file: item.file, url: data.publicUrl, bytes: bytes.length, verified: true }));
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
