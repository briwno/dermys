import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { type ReactNode, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { USAR_MOCK_AUTH } from '@/constants/feature-flags';
import { supabase } from '@/services/supabase';
import type { PerfilUsuario, TipoPerfil } from '@/types/auth';

if (typeof window !== 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

type EtapaAutenticacao = 'boasVindas' | 'perfil' | 'login' | 'cadastro';
type ModoAutenticacao = 'login' | 'cadastro';

interface PropsTelaAutenticacao {
  onComplete: (dados: PerfilUsuario) => void;
}

interface FormularioCadastro {
  nomeCompleto: string;
  email: string;
  telefone: string;
  senha: string;
  nomeEstudio: string;
  enderecoEstudio: string;
  biografia: string;
}

const FORMULARIO_INICIAL: FormularioCadastro = {
  nomeCompleto: '',
  email: '',
  telefone: '',
  senha: '',
  nomeEstudio: '',
  enderecoEstudio: '',
  biografia: '',
};

interface RegistroMock extends PerfilUsuario {
  senha: string;
}

const USUARIOS_MOCK: RegistroMock[] = [
  {
    uid: 'mock-client-1',
    email: 'cliente@dermys.app',
    senha: '123456',
    displayName: 'Cliente Demo',
    nomeExibicao: 'Cliente Demo',
    role: 'cliente',
    tipoPerfil: 'cliente',
    phoneNumber: '11999999999',
    telefone: '11999999999',
    createdAt: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
  },
  {
    uid: 'mock-artist-1',
    email: 'artista@dermys.app',
    senha: '123456',
    displayName: 'Tatuador Demo',
    nomeExibicao: 'Tatuador Demo',
    role: 'artista',
    tipoPerfil: 'artista',
    phoneNumber: '11988888888',
    telefone: '11988888888',
    studioName: 'Studio Demo',
    nomeEstudio: 'Studio Demo',
    studioAddress: 'Rua Exemplo, 123',
    enderecoEstudio: 'Rua Exemplo, 123',
    bio: 'Especialista em fine line.',
    biografia: 'Especialista em fine line.',
    createdAt: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
  },
];

let bancoUsuariosMock: RegistroMock[] = [...USUARIOS_MOCK];

function normalizarEmail(valor: string): string {
  return valor.trim().toLowerCase();
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => {
    setTimeout(resolver, ms);
  });
}

function obterValorTexto(valor: string | undefined, valorAlternativo: string | undefined, valorPadrao: string): string {
  if (typeof valor === 'string' && valor.trim().length > 0) {
    return valor;
  }

  if (typeof valorAlternativo === 'string' && valorAlternativo.trim().length > 0) {
    return valorAlternativo;
  }

  if (typeof valorPadrao === 'string' && valorPadrao.trim().length > 0) {
    return valorPadrao;
  }

  return '';
}

function ehTipoPerfilValido(valor: string | undefined): valor is TipoPerfil {
  if (valor === 'cliente') {
    return true;
  }

  if (valor === 'artista') {
    return true;
  }

  return false;
}

function resolverTipoPerfil(padrao: Partial<PerfilUsuario>, perfilSelecionado: TipoPerfil): TipoPerfil {
  if (ehTipoPerfilValido(padrao.role)) {
    return padrao.role;
  }

  if (ehTipoPerfilValido(padrao.tipoPerfil)) {
    return padrao.tipoPerfil;
  }

  return perfilSelecionado;
}

function criarPerfilBase(padrao: Partial<PerfilUsuario>, formulario: FormularioCadastro, perfilSelecionado: TipoPerfil): PerfilUsuario {
  const nomeExibicao = obterValorTexto(padrao.displayName, padrao.nomeExibicao, obterValorTexto(formulario.nomeCompleto, undefined, 'Usuário'));
  const tipoPerfil = resolverTipoPerfil(padrao, perfilSelecionado);

  const emailPerfil = obterValorTexto(padrao.email, undefined, formulario.email.trim());
  const telefonePerfil = obterValorTexto(padrao.phoneNumber, padrao.telefone, formulario.telefone);
  const fotoPerfil = obterValorTexto(padrao.photoURL, padrao.fotoUrl, '');
  const dataCriacao = obterValorTexto(padrao.createdAt, undefined, new Date().toISOString());
  const nomeEstudioPerfil = obterValorTexto(padrao.studioName, padrao.nomeEstudio, formulario.nomeEstudio);
  const enderecoEstudioPerfil = obterValorTexto(padrao.studioAddress, padrao.enderecoEstudio, formulario.enderecoEstudio);
  const biografiaPerfil = obterValorTexto(padrao.bio, padrao.biografia, formulario.biografia);

  return {
    uid: padrao.uid,
    email: emailPerfil,
    displayName: nomeExibicao,
    nomeExibicao,
    role: tipoPerfil,
    tipoPerfil,
    phoneNumber: telefonePerfil,
    telefone: telefonePerfil,
    photoURL: fotoPerfil,
    fotoUrl: fotoPerfil,
    createdAt: dataCriacao,
    criadoEm: dataCriacao,
    studioName: nomeEstudioPerfil,
    nomeEstudio: nomeEstudioPerfil,
    studioAddress: enderecoEstudioPerfil,
    enderecoEstudio: enderecoEstudioPerfil,
    bio: biografiaPerfil,
    biografia: biografiaPerfil,
  };
}

function converterParaPerfil(registro: RegistroMock): PerfilUsuario {
  const { senha, ...perfil } = registro;
  void senha;

  let perfilPadrao: TipoPerfil = 'cliente';
  if (ehTipoPerfilValido(perfil.role)) {
    perfilPadrao = perfil.role;
  }

  return criarPerfilBase(perfil, FORMULARIO_INICIAL, perfilPadrao);
}

async function buscarPerfilMockPorId(uid: string): Promise<PerfilUsuario | null> {
  const usuario = bancoUsuariosMock.find((item) => item.uid === uid);
  return usuario ? converterParaPerfil(usuario) : null;
}

async function salvarPerfilMock(perfil: PerfilUsuario, senha: string): Promise<void> {
  const indice = bancoUsuariosMock.findIndex((item) => item.uid === perfil.uid);
  const proximoRegistro: RegistroMock = { ...perfil, senha };

  if (indice >= 0) {
    bancoUsuariosMock[indice] = proximoRegistro;
    return;
  }

  bancoUsuariosMock = [...bancoUsuariosMock, proximoRegistro];
}

async function registrarMock(input: { email: string; senha: string; profile: PerfilUsuario }): Promise<PerfilUsuario> {
  await esperar(350);
  const email = normalizarEmail(input.email);
  const jaExiste = bancoUsuariosMock.some((item) => normalizarEmail(item.email) === email);

  if (jaExiste) {
    throw new Error('already registered');
  }

  await salvarPerfilMock({ ...input.profile, email }, input.senha);
  const uidPerfil = typeof input.profile.uid === 'string' ? input.profile.uid : '';
  const salvo = await buscarPerfilMockPorId(uidPerfil);

  if (!salvo) {
    throw new Error('Falha ao salvar perfil mock.');
  }

  return salvo;
}

async function loginMock(emailInput: string, senhaInput: string): Promise<PerfilUsuario> {
  await esperar(300);
  const email = normalizarEmail(emailInput);

  const usuario = bancoUsuariosMock.find((item) => normalizarEmail(item.email) === email);
  if (!usuario) {
    throw new Error('invalid login credentials');
  }

  if (usuario.senha !== senhaInput) {
    throw new Error('invalid login credentials');
  }

  return converterParaPerfil(usuario);
}

async function loginGoogleMock(tipoPerfil: TipoPerfil): Promise<PerfilUsuario> {
  await esperar(250);

  const existente = bancoUsuariosMock.find((item) => item.role === tipoPerfil);
  if (existente) {
    return converterParaPerfil(existente);
  }

  const uid = `mock-google-${Date.now()}`;
  const perfil: PerfilUsuario = {
    uid,
    email: `google-${uid}@dermys.mock`,
    displayName: tipoPerfil === 'artista' ? 'Google Artist Mock' : 'Google Client Mock',
    nomeExibicao: tipoPerfil === 'artista' ? 'Google Artist Mock' : 'Google Client Mock',
    role: tipoPerfil,
    tipoPerfil,
    phoneNumber: '',
    telefone: '',
    photoURL: '',
    fotoUrl: '',
    createdAt: new Date().toISOString(),
    criadoEm: new Date().toISOString(),
  };

  await salvarPerfilMock(perfil, 'google-oauth');
  return perfil;
}

function normalizarErroSupabase(mensagem: string): string {
  const valor = mensagem.toLowerCase();

  if (valor.includes('already registered')) {
    return 'Este e-mail já está em uso.';
  }

  if (valor.includes('already exists')) {
    return 'Este e-mail já está em uso.';
  }

  if (valor.includes('invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (valor.includes('email not confirmed')) {
    return 'Confirme seu e-mail para continuar.';
  }

  if (valor.includes('password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }

  return 'Ocorreu um erro. Tente novamente.';
}

async function buscarPerfilPorId(uid: string): Promise<PerfilUsuario | null> {
  if (USAR_MOCK_AUTH) {
    return buscarPerfilMockPorId(uid);
  }

  const { data, error } = await supabase.from('users').select('*').eq('uid', uid).single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data as PerfilUsuario;
}

export function TelaAutenticacao({ onComplete }: PropsTelaAutenticacao) {
  const [etapa, setEtapa] = useState<EtapaAutenticacao>('boasVindas');
  const [modo, setModo] = useState<ModoAutenticacao>('cadastro');
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil>('cliente');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioCadastro>(FORMULARIO_INICIAL);

  const titulo = useMemo(() => (etapa === 'login' ? 'Entrar' : 'Cadastro'), [etapa]);

  const selecionarModo = (modoSelecionado: ModoAutenticacao) => {
    setModo(modoSelecionado);
    setEtapa('perfil');
    setErro(null);
  };

  const seguirParaPerfil = () => {
    setEtapa(modo === 'login' ? 'login' : 'cadastro');
    setErro(null);
  };

  const tratarErroAutenticacao = (mensagem: string) => {
    setErro(normalizarErroSupabase(mensagem));
  };

  const salvarOuCarregarPerfil = async (fallback: Partial<PerfilUsuario>) => {
    const uid = fallback.uid;
    if (!uid) {
      throw new Error('Sessão inválida.');
    }

    const perfilExistente = await buscarPerfilPorId(uid);
    if (perfilExistente) {
      onComplete(perfilExistente);
      return;
    }

    const perfilData = criarPerfilBase(
      {
        ...fallback,
        role: tipoPerfil,
        tipoPerfil,
      },
      formulario,
      tipoPerfil,
    );

    if (USAR_MOCK_AUTH) {
      let senhaMock = '123456';
      if (typeof formulario.senha === 'string' && formulario.senha.trim().length > 0) {
        senhaMock = formulario.senha;
      }

      await salvarPerfilMock(perfilData, senhaMock);
      onComplete(perfilData);
      return;
    }

    const { error: erroUpsert } = await supabase.from('users').upsert(perfilData, { onConflict: 'uid' });
    if (erroUpsert) {
      throw erroUpsert;
    }

    onComplete(perfilData);
  };

  const handleGoogleSignIn = async () => {
    setCarregando(true);
    setErro(null);

    try {
      if (USAR_MOCK_AUTH) {
        const perfil = await loginGoogleMock(tipoPerfil);
        onComplete(perfil);
        return;
      }

      const redirectTo = Linking.createURL('/');

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (!data?.url) {
        throw new Error('Não foi possível iniciar o login com Google.');
      }

      if (Platform.OS === 'web') {
        await Linking.openURL(data.url);
        return;
      }

      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (authResult.type !== 'success') {
        setErro('Login com Google cancelado.');
        return;
      }

      const parsed = Linking.parse(authResult.url);
      const code = parsed.queryParams?.code;

      if (typeof code !== 'string') {
        throw new Error('Código de autenticação inválido.');
      }

      if (code.length === 0) {
        throw new Error('Código de autenticação inválido.');
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        throw exchangeError;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('Não foi possível recuperar o usuário autenticado.');
      }

      let emailUsuario = formulario.email;
      if (typeof user.email === 'string' && user.email.trim().length > 0) {
        emailUsuario = user.email;
      }

      let nomeExibicaoUsuario = formulario.nomeCompleto;
      if (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim().length > 0) {
        nomeExibicaoUsuario = user.user_metadata.full_name;
      } else if (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim().length > 0) {
        nomeExibicaoUsuario = user.user_metadata.name;
      }

      let telefoneUsuario = formulario.telefone;
      if (typeof user.phone === 'string' && user.phone.trim().length > 0) {
        telefoneUsuario = user.phone;
      }

      await salvarOuCarregarPerfil({
        uid: user.id,
        email: emailUsuario,
        displayName: nomeExibicaoUsuario,
        phoneNumber: telefoneUsuario,
        photoURL: user.user_metadata?.avatar_url,
      });
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido.';
      tratarErroAutenticacao(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const enviarFormulario = async () => {
    const emailFormatado = formulario.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailFormatado) {
      setErro('Por favor, insira um e-mail válido.');
      return;
    }

    if (!emailRegex.test(emailFormatado)) {
      setErro('Por favor, insira um e-mail válido.');
      return;
    }

    if (modo === 'cadastro' && formulario.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      if (modo === 'cadastro') {
        if (USAR_MOCK_AUTH) {
          let nomeCompletoCadastro = 'Usuário';
          if (typeof formulario.nomeCompleto === 'string' && formulario.nomeCompleto.trim().length > 0) {
            nomeCompletoCadastro = formulario.nomeCompleto;
          }

          const perfilData = criarPerfilBase(
            {
              uid: `mock-${Date.now()}`,
              email: emailFormatado,
              displayName: nomeCompletoCadastro,
              phoneNumber: formulario.telefone,
              createdAt: new Date().toISOString(),
            },
            formulario,
            tipoPerfil,
          );

          const perfil = await registrarMock({
            email: emailFormatado,
            senha: formulario.senha,
            profile: perfilData,
          });

          onComplete(perfil);
          return;
        }

        const { data, error: erroCadastro } = await supabase.auth.signUp({
          email: emailFormatado,
          password: formulario.senha,
        });

        if (erroCadastro) {
          throw erroCadastro;
        }

        const usuario = data.user;
        if (!usuario) {
          throw new Error('Usuário não retornado no cadastro.');
        }

        await salvarOuCarregarPerfil({
          uid: usuario.id,
          email: emailFormatado,
          displayName: formulario.nomeCompleto,
          phoneNumber: formulario.telefone,
        });
      } else {
        if (USAR_MOCK_AUTH) {
          const perfil = await loginMock(emailFormatado, formulario.senha);
          onComplete(perfil);
          return;
        }

        const { data, error: erroLogin } = await supabase.auth.signInWithPassword({
          email: emailFormatado,
          password: formulario.senha,
        });

        if (erroLogin) {
          throw erroLogin;
        }

        const usuario = data.user;
        if (!usuario) {
          throw new Error('Usuário não retornado no login.');
        }

        const perfil = await buscarPerfilPorId(usuario.id);
        if (!perfil) {
          setErro('Perfil não encontrado no banco de dados.');
          return;
        }

        onComplete(perfil);
      }
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido.';
      tratarErroAutenticacao(mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const renderBoasVindas = () => (
    <View style={styles.sectionCenter}>
      <View style={styles.brandWrap}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>D</Text>
        </View>
        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>Dermys</Text>
          <Text style={styles.brandSubTitle}>Arte Incontestável</Text>
        </View>
      </View>

      <View style={styles.actionsWrap}>
        <TouchableOpacity style={[styles.buttonBase, styles.buttonGhost]} activeOpacity={0.85} onPress={() => selecionarModo('login')}>
          <Text style={[styles.buttonTextBase, styles.buttonTextLight]}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonBase, styles.buttonPrimary]} activeOpacity={0.85} onPress={() => selecionarModo('cadastro')}>
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPerfil = () => (
    <View style={styles.sectionStack}>
      <View style={styles.headerWrap}>
        <Text style={styles.screenTitle}>Quem é você?</Text>
        <Text style={styles.screenMeta}>Selecione seu perfil</Text>
      </View>

      <View style={styles.cardList}>
        <TouchableOpacity
          style={[styles.roleCard, tipoPerfil === 'cliente' ? styles.roleCardActive : styles.roleCardIdle]}
          activeOpacity={0.85}
          onPress={() => setTipoPerfil('cliente')}
        >
          <View style={styles.roleHead}>
            <Text style={[styles.roleIcon, tipoPerfil === 'cliente' ? styles.roleIconActive : styles.roleIconIdle]}>C</Text>
            <View style={[styles.roleDot, tipoPerfil === 'cliente' ? styles.roleDotOn : styles.roleDotOff]} />
          </View>
          <Text style={styles.roleTitle}>Cliente</Text>
          <Text style={styles.roleDescription}>Buscando artes e agendamentos.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, tipoPerfil === 'artista' ? styles.roleCardActive : styles.roleCardIdle]}
          activeOpacity={0.85}
          onPress={() => setTipoPerfil('artista')}
        >
          <View style={styles.roleHead}>
            <Text style={[styles.roleIcon, tipoPerfil === 'artista' ? styles.roleIconActive : styles.roleIconIdle]}>T</Text>
            <View style={[styles.roleDot, tipoPerfil === 'artista' ? styles.roleDotOn : styles.roleDotOff]} />
          </View>
          <Text style={styles.roleTitle}>Tatuador</Text>
          <Text style={styles.roleDescription}>Gerenciando estúdio e agenda.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rowButtons}>
        <TouchableOpacity style={[styles.buttonBase, styles.buttonGhost, styles.growOne]} onPress={() => setEtapa('boasVindas')} activeOpacity={0.85}>
          <Text style={[styles.buttonTextBase, styles.buttonTextLight]}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonBase, styles.buttonPrimary, styles.growTwo]} onPress={seguirParaPerfil} activeOpacity={0.85}>
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInput = (
    chave: keyof FormularioCadastro,
    placeholder: string,
    icone: string,
    opcoes?: {
      secure?: boolean;
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
    },
  ) => (
    <View style={styles.inputWrap}>
      {!opcoes?.multiline && <Text style={styles.inputIconText}>{icone}</Text>}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6f6f6f"
        value={formulario[chave]}
        secureTextEntry={opcoes?.secure}
        keyboardType={opcoes?.keyboardType}
        autoCapitalize={
          (() => {
            if (typeof opcoes?.autoCapitalize === 'string' && opcoes.autoCapitalize.length > 0) {
              return opcoes.autoCapitalize;
            }
            return 'none';
          })()
        }
        onChangeText={(texto) => setFormulario((anterior) => ({ ...anterior, [chave]: texto }))}
        style={[
          styles.input,
          opcoes?.multiline ? styles.inputMultiline : null,
          !opcoes?.multiline ? styles.inputWithIcon : null,
        ]}
        multiline={opcoes?.multiline}
        textAlignVertical={opcoes?.multiline ? 'top' : 'center'}
      />
    </View>
  );

  const renderAutenticacao = () => (
    <View style={styles.sectionStack}>
      <View style={styles.headerWrap}>
        <Text style={styles.screenTitle}>{titulo}</Text>
        <Text style={styles.screenMeta}>Como {tipoPerfil === 'artista' ? 'Tatuador' : 'Cliente'}</Text>
      </View>

      {erro ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      <View style={styles.inputStack}>
        {etapa === 'cadastro' ? renderInput('nomeCompleto', 'Nome completo', 'N', { autoCapitalize: 'words' }) : null}

        {renderInput('email', 'E-mail', '@', { keyboardType: 'email-address', autoCapitalize: 'none' })}

        {etapa === 'cadastro' ? renderInput('telefone', 'Telefone', 'F', { keyboardType: 'phone-pad' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('nomeEstudio', 'Nome do estúdio', 'E', { autoCapitalize: 'words' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('enderecoEstudio', 'Endereço do estúdio', 'L', { autoCapitalize: 'sentences' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('biografia', 'Sua bio / descrição curta', 'B', { multiline: true, autoCapitalize: 'sentences' }) : null}

        {renderInput('senha', etapa === 'cadastro' ? 'Crie uma senha' : 'Sua senha', '*', { secure: true, autoCapitalize: 'none' })}
      </View>

      <View style={styles.actionsWrap}>
        <TouchableOpacity onPress={enviarFormulario} disabled={carregando} style={[styles.buttonBase, styles.buttonPrimary, carregando ? styles.buttonDisabled : null]} activeOpacity={0.85}>
          {carregando ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>{etapa === 'login' ? 'Entrar' : 'Finalizar registro'}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.separatorWrap}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>Ou</Text>
          <View style={styles.separatorLine} />
        </View>

        <TouchableOpacity onPress={handleGoogleSignIn} disabled={carregando} style={[styles.buttonBase, styles.buttonGoogle, carregando ? styles.buttonDisabled : null]} activeOpacity={0.85}>
          <View style={styles.googleGlyphWrap}>
            <Text style={styles.googleGlyph}>G</Text>
          </View>
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Google</Text>
          <Text style={styles.chevron}>{'>'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setEtapa('perfil')} style={styles.backLink} activeOpacity={0.85}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  let conteudo: ReactNode = null;

  if (etapa === 'boasVindas') {
    conteudo = renderBoasVindas();
  } else if (etapa === 'perfil') {
    conteudo = renderPerfil();
  } else {
    if (etapa === 'login') {
      conteudo = renderAutenticacao();
    } else if (etapa === 'cadastro') {
      conteudo = renderAutenticacao();
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {conteudo}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#070707' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'center' },
  sectionCenter: { gap: 42 },
  sectionStack: { gap: 24 },
  brandWrap: { alignItems: 'center', gap: 16 },
  logoCircle: { width: 140, height: 140, borderRadius: 999, backgroundColor: '#111', borderWidth: 1, borderColor: '#222', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 72, color: '#B7FD58', fontWeight: '900' },
  brandTextWrap: { alignItems: 'center', gap: 2 },
  brandTitle: { color: '#B7FD58', fontSize: 48, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1.5 },
  brandSubTitle: { color: '#666', textTransform: 'uppercase', fontSize: 10, fontWeight: '900', letterSpacing: 4 },
  headerWrap: { gap: 8 },
  screenTitle: { color: '#B7FD58', fontSize: 32, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1 },
  screenMeta: { color: '#666', textTransform: 'uppercase', fontSize: 10, fontWeight: '900', letterSpacing: 2.5 },
  actionsWrap: { gap: 14 },
  rowButtons: { flexDirection: 'row', gap: 12 },
  growOne: { flex: 1 },
  growTwo: { flex: 2 },
  buttonBase: { minHeight: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  buttonGhost: { backgroundColor: '#131313', borderWidth: 1, borderColor: '#282828' },
  buttonPrimary: { backgroundColor: '#B7FD58' },
  buttonGoogle: { backgroundColor: '#fff' },
  buttonDisabled: { opacity: 0.55 },
  buttonTextBase: { fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.3, fontSize: 12 },
  buttonTextLight: { color: '#fff' },
  buttonTextDark: { color: '#111' },
  cardList: { gap: 12 },
  roleCard: { borderRadius: 24, borderWidth: 2, padding: 18, gap: 10 },
  roleCardIdle: { borderColor: '#202020', backgroundColor: '#101010' },
  roleCardActive: { borderColor: '#B7FD58', backgroundColor: '#121b08' },
  roleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleIcon: { fontSize: 30, fontWeight: '900', minWidth: 24 },
  roleIconIdle: { color: '#666' },
  roleIconActive: { color: '#B7FD58' },
  roleDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  roleDotOff: { borderColor: '#333' },
  roleDotOn: { borderColor: '#B7FD58', backgroundColor: '#B7FD58' },
  roleTitle: { color: '#fff', fontWeight: '900', fontSize: 20, textTransform: 'uppercase', fontStyle: 'italic' },
  roleDescription: { color: '#8a8a8a', fontSize: 12, fontWeight: '600' },
  errorBanner: { borderRadius: 14, borderWidth: 1, borderColor: '#6d1f1f', backgroundColor: '#2c1010', padding: 12 },
  errorText: { color: '#ff8989', textAlign: 'center', textTransform: 'uppercase', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  inputStack: { gap: 10 },
  inputWrap: { position: 'relative' },
  inputIconText: { position: 'absolute', left: 13, top: 16, zIndex: 2, color: '#737373', fontWeight: '800', width: 16, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#2b2b2b', borderRadius: 14, backgroundColor: '#111111', color: '#fff', minHeight: 54, paddingHorizontal: 14, fontSize: 14 },
  inputWithIcon: { paddingLeft: 40 },
  inputMultiline: { minHeight: 96, paddingTop: 12 },
  separatorWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 3 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#1d1d1d' },
  separatorText: { color: '#777', textTransform: 'uppercase', fontWeight: '800', fontSize: 10, letterSpacing: 2 },
  googleGlyphWrap: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  googleGlyph: { color: '#111', fontWeight: '900', fontSize: 12 },
  chevron: { color: '#111', fontSize: 16, fontWeight: '900' },
  backLink: { minHeight: 40, justifyContent: 'center', alignItems: 'center' },
  backLinkText: { color: '#888', textTransform: 'uppercase', fontWeight: '900', fontSize: 10, letterSpacing: 2 },
});
