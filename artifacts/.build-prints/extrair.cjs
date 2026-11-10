const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const specs = [
  ['01-login-google', 'Entrada com Google', 'AUTH / GOOGLE', 'src/services/auth-oauth.ts', [[57,64]], [57,62]],
  ['02-briefing', 'A ideia vira um pedido', 'CLIENTE / BRIEFING', 'src/telas/cliente/modal-reserva.tsx', [[491,499],[506,509]], [492,509]],
  ['03-proposta', 'O artista envia a proposta', 'ARTISTA / ORÇAMENTO', 'src/components/chat/painel-chat-realtime.tsx', [[349,362]], [350,358]],
  ['04-sinal', 'Registro do sinal da reserva', 'FINANCEIRO / SINAL SIMULADO', 'src/services/mercadopago.ts', [[157,171]], [158,165]],
  ['05-anamnese', 'A ficha acompanha a sessão', 'CLIENTE / ANAMNESE', 'src/telas/cliente/agendamentos-tab.tsx', [[241,252]], [242,249]],
  ['06-conclusao', 'Pagamento e sessão concluída', 'ARTISTA / CONCLUSÃO', 'src/telas/artista/agenda-tab.tsx', [[292,300],[307,310]], [297,307]],
  ['07-dre', 'Receitas e despesas formam o resultado', 'ESTÚDIO / DRE', 'src/services/dre.ts', [[30,45]], [30,34]],
];
const colors = {base:'#d5d9e5', keyword:'#c4a7ff', string:'#b9df91', number:'#f7ba7e', comment:'#768391', function:'#88d6ee', operator:'#8d9ab0'};
const out = specs.map(([id,title,kicker,file,ranges,highlights]) => {
  const all = fs.readFileSync(path.join(root,file),'utf8').split(/\r?\n/);
  const selected=[];
  for(let r=0;r<ranges.length;r++) {
    if(r)selected.push({n:null,text:'// …'});
    for(let n=ranges[r][0];n<=ranges[r][1];n++)selected.push({n,text:all[n-1]});
  }
  const indent=Math.min(...selected.filter(l=>l.text.trim()&&l.n).map(l=>l.text.match(/^ */)[0].length));
  const lines=selected.map(l=>{
    const text=l.n?l.text.slice(indent):l.text;
    const scanner=ts.createScanner(ts.ScriptTarget.Latest,false,ts.LanguageVariant.Standard,text);
    const tokens=[];let kind;
    while((kind=scanner.scan())!==ts.SyntaxKind.EndOfFileToken){
      const value=scanner.getTokenText(); let color=colors.base;
      if(kind>=ts.SyntaxKind.FirstKeyword&&kind<=ts.SyntaxKind.LastKeyword)color=colors.keyword;
      else if([ts.SyntaxKind.StringLiteral,ts.SyntaxKind.NoSubstitutionTemplateLiteral,ts.SyntaxKind.TemplateHead,ts.SyntaxKind.TemplateMiddle,ts.SyntaxKind.TemplateTail].includes(kind))color=colors.string;
      else if(kind===ts.SyntaxKind.NumericLiteral)color=colors.number;
      else if([ts.SyntaxKind.SingleLineCommentTrivia,ts.SyntaxKind.MultiLineCommentTrivia].includes(kind))color=colors.comment;
      else if(kind===ts.SyntaxKind.Identifier&&/^\s*\(/.test(text.slice(scanner.getTextPos())))color=colors.function;
      else if(kind>=ts.SyntaxKind.FirstPunctuation&&kind<=ts.SyntaxKind.LastPunctuation)color=colors.operator;
      tokens.push({text:value,color});
    }
    return {n:l.n,text,tokens,highlight:highlights.includes(l.n)};
  });
  return {id,title,kicker,file,lines};
});
fs.writeFileSync(path.join(__dirname,'trechos.json'),JSON.stringify(out,null,2));
console.log(`${out.length} trechos extraídos dos arquivos reais.`);
