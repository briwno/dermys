import { Logo } from '@/components/logo';
import { iniciarLoginGoogle } from '@/services/auth-oauth';
import { supabase } from '@/services/supabase';
import { normalizarPerfil, type PerfilUsuario, type TipoPerfil } from '@/types/auth';
import * as WebBrowser from 'expo-web-browser';
import {
  AlignLeft,
  Building,
  Compass,
  Lock,
  Mail,
  MapPin,
  Palette,
  Phone,
  User,
} from 'lucide-react-native';
import React, { useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

if (typeof window !== 'undefined') {
  WebBrowser.maybeCompleteAuthSession();
}

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

type EtapaAutenticacao = 'boasVindas' | 'perfil' | 'login' | 'cadastro' | 'completarPerfil';
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

export function TelaAutenticacao({ onComplete }: PropsTelaAutenticacao) {
  const [etapa, setEtapa] = useState<EtapaAutenticacao>('boasVindas');
  const [modo, setModo] = useState<ModoAutenticacao>('cadastro');
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil>('cliente');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioCadastro>(FORMULARIO_INICIAL);
  const [userIdAtivo, setUserIdAtivo] = useState<string>('');
  const [userFotoUrl, setUserFotoUrl] = useState<string>('');

  const titulo = useMemo(() => {
    if (etapa === 'completarPerfil') return 'Complete seu Perfil';
    return etapa === 'login' ? 'Entrar' : 'Cadastro';
  }, [etapa]);

  const selecionarModo = (modoSelecionado: ModoAutenticacao) => {
    setModo(modoSelecionado);
    setEtapa('perfil');
    setErro(null);
  };

  const seguirParaFormulario = () => {
    setEtapa(modo === 'login' ? 'login' : 'cadastro');
    setErro(null);
  };

  // Salva no banco de dados Supabase garantindo colunas corretas
  const salvarPerfilNoBanco = async (id: string, email: string, fotoUrl?: string) => {
    const nomeFinal = formulario.nomeCompleto.trim() || email.split('@')[0] || 'Usuário';

    const payloadDB = {
      id,
      email: email.trim().toLowerCase(),
      nome_exibicao: nomeFinal,
      tipo_perfil: tipoPerfil,
      telefone: formulario.telefone.trim() || null,
      foto_url: fotoUrl || userFotoUrl || null,
      nome_estudio: tipoPerfil === 'artista' ? (formulario.nomeEstudio.trim() || 'Estúdio Particular') : null,
      endereco_estudio: tipoPerfil === 'artista' ? (formulario.enderecoEstudio.trim() || null) : null,
      biografia: tipoPerfil === 'artista' ? (formulario.biografia.trim() || null) : null,
      atualizado_em: new Date().toISOString(),
    };

    const { data: salvo, error: errUpsert } = await supabase
      .from('profiles')
      .upsert(payloadDB, { onConflict: 'id' })
      .select('*')
      .single();

    if (errUpsert) throw errUpsert;
    return normalizarPerfil(salvo || payloadDB);
  };

  // Login com Google
  const handleGoogleSignIn = async () => {
    setCarregando(true);
    setErro(null);

    try {
      const user = await iniciarLoginGoogle();
      if (!user) {
        // Redirecionamento em andamento no browser
        return;
      }

      // Verifica se já existe perfil cadastrado com dados essenciais
      const { data: profileExistente } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const nomeGoogle = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const emailGoogle = user.email || '';
      const fotoGoogle = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

      // Se o perfil já existe e tem o tipo de perfil e nome definidos, loga direto!
      if (profileExistente && profileExistente.tipo_perfil && profileExistente.nome_exibicao) {
        onComplete(normalizarPerfil(profileExistente));
        return;
      }

      // Se for novo cadastro ou faltar preenchimento, prepara os dados do Google e pede para completar
      setUserIdAtivo(user.id);
      setUserFotoUrl(fotoGoogle);
      setFormulario((prev) => ({
        ...prev,
        nomeCompleto: profileExistente?.nome_exibicao || nomeGoogle || prev.nomeCompleto,
        email: emailGoogle || prev.email,
        telefone: profileExistente?.telefone || prev.telefone,
        nomeEstudio: profileExistente?.nome_estudio || prev.nomeEstudio,
        enderecoEstudio: profileExistente?.endereco_estudio || prev.enderecoEstudio,
        biografia: profileExistente?.biografia || prev.biografia,
      }));

      if (profileExistente?.tipo_perfil === 'artista') {
        setTipoPerfil('artista');
      } else {
        setTipoPerfil('cliente');
      }

      setEtapa('completarPerfil');
    } catch (err: any) {
      setErro(err.message || 'Erro no login com Google.');
    } finally {
      setCarregando(false);
    }
  };

  // Finalizar preenchimento do perfil
  const handleFinalizarCompletarPerfil = async () => {
    if (!formulario.nomeCompleto.trim()) {
      setErro('Por favor, informe seu nome.');
      return;
    }

    if (tipoPerfil === 'artista' && !formulario.nomeEstudio.trim()) {
      setErro('Por favor, informe o nome do seu estúdio.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      const perfilSalvo = await salvarPerfilNoBanco(userIdAtivo, formulario.email, userFotoUrl);
      onComplete(perfilSalvo);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar perfil.');
    } finally {
      setCarregando(false);
    }
  };

  // Enviar formulário de Login ou Cadastro tradicional
  const enviarFormulario = async () => {
    const emailFormatado = formulario.email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailFormatado || !emailRegex.test(emailFormatado)) {
      setErro('Por favor, insira um e-mail válido.');
      return;
    }

    if (formulario.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setCarregando(true);
    setErro(null);

    try {
      if (modo === 'cadastro') {
        const { data, error: erroCadastro } = await supabase.auth.signUp({
          email: emailFormatado,
          password: formulario.senha,
          options: {
            data: {
              nome_exibicao: formulario.nomeCompleto,
              full_name: formulario.nomeCompleto,
              tipo_perfil: tipoPerfil,
              telefone: formulario.telefone,
            },
          },
        });

        if (erroCadastro) throw erroCadastro;
        if (!data.user) throw new Error('Usuário não retornado no cadastro.');

        const perfilSalvo = await salvarPerfilNoBanco(data.user.id, emailFormatado);
        onComplete(perfilSalvo);
      } else {
        // Modo Login
        const { data, error: erroLogin } = await supabase.auth.signInWithPassword({
          email: emailFormatado,
          password: formulario.senha,
        });

        if (erroLogin) throw erroLogin;
        if (!data.user) throw new Error('Usuário não retornado no login.');

        // Busca perfil no banco
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (dbProfile && dbProfile.tipo_perfil && dbProfile.nome_exibicao) {
          onComplete(normalizarPerfil(dbProfile));
          return;
        }

        // Se perfil estiver incompleto, abre tela de completar
        setUserIdAtivo(data.user.id);
        setFormulario((prev) => ({
          ...prev,
          nomeCompleto: dbProfile?.nome_exibicao || prev.nomeCompleto,
          email: emailFormatado,
          telefone: dbProfile?.telefone || prev.telefone,
          nomeEstudio: dbProfile?.nome_estudio || prev.nomeEstudio,
          enderecoEstudio: dbProfile?.endereco_estudio || prev.enderecoEstudio,
          biografia: dbProfile?.biografia || prev.biografia,
        }));
        if (dbProfile?.tipo_perfil === 'artista') {
          setTipoPerfil('artista');
        }
        setEtapa('completarPerfil');
      }
    } catch (err: any) {
      setErro(err.message || 'Ocorreu um erro.');
    } finally {
      setCarregando(false);
    }
  };

  const renderBoasVindas = () => (
    <View style={styles.sectionCenter}>
      <View style={styles.brandWrap}>
        <Logo size={200} color="#f3c21a" />

        <View style={styles.brandTextWrap}>
          <Text style={styles.brandTitle}>DERMYS</Text>
          <Text style={styles.brandSubTitle}>ARTE INCONTESTÁVEL</Text>
        </View>
      </View>

      <View style={styles.actionsWrap}>
        <TouchableOpacity style={[styles.buttonBase, styles.buttonGhost]} activeOpacity={0.85} onPress={() => selecionarModo('login')}>
          <Text style={[styles.buttonTextBase, styles.buttonTextLight]}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.buttonBase, styles.buttonPrimary]} activeOpacity={0.85} onPress={() => selecionarModo('cadastro')}>
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Cadastrar</Text>
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separatorWrap}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Google Direto */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={carregando}
          style={[styles.buttonBase, styles.buttonGoogle, carregando ? styles.buttonDisabled : null]}
          activeOpacity={0.85}
        >
          <GoogleIcon size={20} />
          <Text style={[styles.buttonTextBase, styles.buttonTextGoogle]}>Continuar com o Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPerfil = () => (
    <View style={styles.sectionStack}>
      <View style={styles.headerWrap}>
        <Text style={styles.screenTitle}>Quem é você?</Text>
        <Text style={styles.screenMeta}>Selecione seu perfil para continuar</Text>
      </View>

      <View style={styles.cardList}>
        <TouchableOpacity
          style={[styles.roleCard, tipoPerfil === 'cliente' ? styles.roleCardActive : styles.roleCardIdle]}
          activeOpacity={0.85}
          onPress={() => setTipoPerfil('cliente')}
        >
          <View style={styles.roleHead}>
            <Compass size={20} color={tipoPerfil === 'cliente' ? '#f3c21a' : '#6b7280'} />
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
            <Palette size={20} color={tipoPerfil === 'artista' ? '#f3c21a' : '#6b7280'} />
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

        <TouchableOpacity style={[styles.buttonBase, styles.buttonPrimary, styles.growTwo]} onPress={seguirParaFormulario} activeOpacity={0.85}>
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInput = (
    chave: keyof FormularioCadastro,
    placeholder: string,
    IconComp: React.ComponentType<{ size: number; color: string }>,
    opcoes?: {
      secure?: boolean;
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      editable?: boolean;
    },
  ) => (
    <View style={styles.inputWrap}>
      {!opcoes?.multiline && (
        <View style={styles.inputIcon}>
          <IconComp size={18} color="#6f6f6f" />
        </View>
      )}
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#6f6f6f"
        value={formulario[chave]}
        secureTextEntry={opcoes?.secure}
        keyboardType={opcoes?.keyboardType}
        editable={opcoes?.editable !== false}
        autoCapitalize={opcoes?.autoCapitalize || 'none'}
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

  // Tela dedicada para completar dados quando cadastra pelo Google ou faltam dados
  const renderCompletarPerfil = () => (
    <View style={styles.sectionStack}>
      <View style={styles.headerWrap}>
        <Text style={styles.screenTitle}>Complete seu Perfil</Text>
        <Text style={styles.screenMeta}>Confirme seus dados para acessar o Dermys</Text>
      </View>

      {erro ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      {/* Seleção do Perfil */}
      <View style={styles.cardList}>
        <TouchableOpacity
          style={[styles.roleCard, tipoPerfil === 'cliente' ? styles.roleCardActive : styles.roleCardIdle]}
          activeOpacity={0.85}
          onPress={() => setTipoPerfil('cliente')}
        >
          <View style={styles.roleHead}>
            <Compass size={18} color={tipoPerfil === 'cliente' ? '#f3c21a' : '#6b7280'} />
            <Text style={styles.roleTitle}>Sou Cliente</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, tipoPerfil === 'artista' ? styles.roleCardActive : styles.roleCardIdle]}
          activeOpacity={0.85}
          onPress={() => setTipoPerfil('artista')}
        >
          <View style={styles.roleHead}>
            <Palette size={18} color={tipoPerfil === 'artista' ? '#f3c21a' : '#6b7280'} />
            <Text style={styles.roleTitle}>Sou Tatuador / Estúdio</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.inputStack}>
        {renderInput('nomeCompleto', 'Seu Nome (pode editar)', User, { autoCapitalize: 'words' })}

        {renderInput('email', 'E-mail', Mail, { editable: false })}

        {renderInput('telefone', 'Telefone / WhatsApp', Phone, { keyboardType: 'phone-pad' })}

        {tipoPerfil === 'artista' && (
          <>
            {renderInput('nomeEstudio', 'Nome do estúdio', Building, { autoCapitalize: 'words' })}
            {renderInput('enderecoEstudio', 'Endereço / Cidade do estúdio', MapPin, { autoCapitalize: 'sentences' })}
            {renderInput('biografia', 'Sua bio / especialidades', AlignLeft, { multiline: true, autoCapitalize: 'sentences' })}
          </>
        )}
      </View>

      <TouchableOpacity
        onPress={handleFinalizarCompletarPerfil}
        disabled={carregando}
        style={[styles.buttonBase, styles.buttonPrimary, carregando ? styles.buttonDisabled : null]}
        activeOpacity={0.85}
      >
        {carregando ? (
          <ActivityIndicator color="#111" />
        ) : (
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Salvar e Acessar Dermys</Text>
        )}
      </TouchableOpacity>
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
        {etapa === 'cadastro' ? renderInput('nomeCompleto', 'Nome completo', User, { autoCapitalize: 'words' }) : null}

        {renderInput('email', 'E-mail', Mail, { keyboardType: 'email-address', autoCapitalize: 'none' })}

        {etapa === 'cadastro' ? renderInput('telefone', 'Telefone', Phone, { keyboardType: 'phone-pad' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('nomeEstudio', 'Nome do estúdio', Building, { autoCapitalize: 'words' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('enderecoEstudio', 'Endereço do estúdio', MapPin, { autoCapitalize: 'sentences' }) : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista' ? renderInput('biografia', 'Sua bio / descrição curta', AlignLeft, { multiline: true, autoCapitalize: 'sentences' }) : null}

        {renderInput('senha', etapa === 'cadastro' ? 'Crie uma senha' : 'Sua senha', Lock, { secure: true, autoCapitalize: 'none' })}
      </View>

      <View style={styles.actionsWrap}>
        <TouchableOpacity onPress={enviarFormulario} disabled={carregando} style={[styles.buttonBase, styles.buttonPrimary, carregando ? styles.buttonDisabled : null]} activeOpacity={0.85}>
          {carregando ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>{etapa === 'login' ? 'Entrar' : 'Finalizar registro'}</Text>
          )}
        </TouchableOpacity>

        {/* Separador */}
        <View style={styles.separatorWrap}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>ou</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Botão Google Auth */}
        <TouchableOpacity
          onPress={handleGoogleSignIn}
          disabled={carregando}
          style={[styles.buttonBase, styles.buttonGoogle, carregando ? styles.buttonDisabled : null]}
          activeOpacity={0.85}
        >
          <GoogleIcon size={20} />
          <Text style={[styles.buttonTextBase, styles.buttonTextGoogle]}>Continuar com o Google</Text>
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
  } else if (etapa === 'completarPerfil') {
    conteudo = renderCompletarPerfil();
  } else {
    conteudo = renderAutenticacao();
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
  safeArea: { flex: 1, backgroundColor: '#050505' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'center' },
  sectionCenter: { gap: 24 },
  sectionStack: { gap: 20 },
  brandWrap: { alignItems: 'center', gap: 16 },
  brandTextWrap: { alignItems: 'center', gap: 2 },
  brandTitle: { color: '#f3c21a', fontSize: 52, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 52 },
  brandSubTitle: { color: '#f5f5f5', textTransform: 'uppercase', fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  headerWrap: { gap: 6 },
  screenTitle: { color: '#f3c21a', fontSize: 28, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1 },
  screenMeta: { color: '#777', textTransform: 'uppercase', fontSize: 10, fontWeight: '900', letterSpacing: 2.5 },
  actionsWrap: { gap: 12 },
  rowButtons: { flexDirection: 'row', gap: 12 },
  growOne: { flex: 1 },
  growTwo: { flex: 2 },
  buttonBase: { minHeight: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  buttonGhost: { backgroundColor: '#1d1d1d', borderWidth: 1, borderColor: '#2d2d2d' },
  buttonPrimary: { backgroundColor: '#f3c21a' },
  buttonGoogle: { backgroundColor: '#ffffff' },
  buttonDisabled: { opacity: 0.6 },
  buttonTextBase: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  buttonTextDark: { color: '#111' },
  buttonTextLight: { color: '#fff' },
  buttonTextGoogle: { color: '#1f2937' },
  separatorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 2,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#222',
  },
  separatorText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardList: { gap: 10 },
  roleCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 4 },
  roleCardIdle: { backgroundColor: '#101010', borderColor: '#222' },
  roleCardActive: { backgroundColor: '#161616', borderColor: '#f3c21a' },
  roleHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roleDot: { width: 10, height: 10, borderRadius: 5 },
  roleDotOff: { backgroundColor: '#333' },
  roleDotOn: { backgroundColor: '#f3c21a' },
  roleTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  roleDescription: { color: '#888', fontSize: 11 },
  inputStack: { gap: 10 },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 2 },
  input: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#1f1f1f',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  inputWithIcon: { paddingLeft: 46 },
  inputMultiline: { minHeight: 74, paddingVertical: 12 },
  errorBanner: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', borderRadius: 10, padding: 10 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700' },
  backLink: { alignItems: 'center', paddingVertical: 6 },
  backLinkText: { color: '#777', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
});
