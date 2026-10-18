const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createClient } = require('@supabase/supabase-js');

async function main() {
  const root = path.resolve(__dirname, '..');
  process.loadEnvFile(path.join(root, '.env'));
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (new URL(url).hostname !== 'iklbyztvjvxfhgupmkvw.supabase.co') throw new Error('Projeto inesperado.');
  const client = createClient(url, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } });
  const source = fs.readFileSync(path.join(root, 'src/components/debug/types.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const mod = { exports: {} };
  new Function('exports', compiled)(mod.exports);
  const personas = mod.exports.PERSONAS_TESTE;
  if (personas.length !== 9) throw new Error('Esperados exatamente nove perfis de demonstração.');
  const folder = path.join(root, 'assets/demo/avatars');
  fs.mkdirSync(folder, { recursive: true });
  const manifest = [];
  const previousPath = path.join(folder, 'manifest.json');
  const previous = fs.existsSync(previousPath) ? JSON.parse(fs.readFileSync(previousPath, 'utf8')) : [];
  for (const persona of personas) {
    const original = new URL(persona.avatarUrl);
    // Mantém a origem original do seletor mesmo depois de ele apontar ao Storage.
    const sourceUrl = previous.find(item => item.id === persona.id)?.source || original.href;
    if (new URL(sourceUrl).hostname !== 'images.unsplash.com') throw new Error('Origem de avatar inesperada.');
    const response = await fetch(sourceUrl);
    if (!response.ok) throw new Error(`Falha no avatar ${persona.nome}: ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('O avatar não é JPEG.');
    const file = `${persona.id}.jpg`;
    fs.writeFileSync(path.join(folder, file), bytes);
    const storagePath = `demo/personas-v1/${file}`;
    const { data: existing, error: listError } = await client.storage.from('avatars').list('demo/personas-v1', { search: file });
    if (listError) throw listError;
    if (!existing.some(item => item.name === file)) {
      const { error } = await client.storage.from('avatars').upload(storagePath, bytes,
        { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false });
      if (error) throw error;
    }
    const publicUrl = client.storage.from('avatars').getPublicUrl(storagePath).data.publicUrl;
    const verify = await fetch(publicUrl);
    if (!verify.ok || !verify.headers.get('content-type')?.startsWith('image/')) throw new Error('Avatar público indisponível.');
    await verify.arrayBuffer();
    manifest.push({ id: persona.id, nome: persona.nome, source: sourceUrl, publicUrl });
    fs.writeFileSync(path.join(folder, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    console.log(JSON.stringify({ nome: persona.nome, verified: true }));
  }
  const quote = value => "'" + value.replaceAll("'", "''") + "'";
  const rows = manifest.map(item => `(${quote(item.id)}::uuid, ${quote(item.publicUrl)})`).join(',\n');
  const sql = `-- Apenas avatares dos nove perfis de demonstração.\nwith avatares(id, url) as (values\n${rows}\n)\nupdate public.profiles p set foto_url = a.url from avatares a where p.id = a.id\nreturning p.id, p.nome_exibicao;\n`;
  fs.writeFileSync(path.join(root, 'scripts/populate-demo-avatars.sql'), sql);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
