import { Logo } from '@/components/logo';
import { AUTH_REDIRECT_URL, iniciarLoginGoogle } from '@/services/auth-oauth';
import { supabase } from '@/services/supabase';
import {
  normalizarPerfil,
  verificarStatusPerfil,
  type CampoFaltante,
  type PerfilUsuario,
  type TipoPerfil,
} from '@/types/auth';
import * as WebBrowser from 'expo-web-browser';
import {
  AlertCircle,
  AlignLeft,
  Building,
  CheckCircle2,
  Compass,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Palette,
  Phone,
  Sparkles,
  User,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
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

const ESTILOS_DISPONIVEIS = [
  'Fine Line',
  'Blackwork',
  'Realismo',
  'Old School',
  'Aquarela',
  'Geek',
  'Floral',
  'Lettering',
  'Tribal / Oriental',
];

type EtapaAutenticacao = 'boasVindas' | 'perfil' | 'login' | 'cadastro' | 'completarPerfil';
type ModoAutenticacao = 'login' | 'cadastro';

export interface SessaoAuthInfo {
  id: string;
  email?: string;
  nome?: string;
  fotoUrl?: string;
}

export interface PropsTelaAutenticacao {
  onComplete: (dados: PerfilUsuario) => void;
  sessaoAuth?: SessaoAuthInfo | null;
  dadosIncompletos?: Partial<PerfilUsuario> | null;
  onLogout?: () => Promise<void> | void;
}

interface FormularioCadastro {
  nomeCompleto: string;
  email: string;
  telefone: string;
  cidade: string;
  senha: string;
  nomeEstudio: string;
  enderecoEstudio: string;
  biografia: string;
  estiloPrincipal: string;
}

const FORMULARIO_INICIAL: FormularioCadastro = {
  nomeCompleto: '',
  email: '',
  telefone: '',
  cidade: '',
  senha: '',
  nomeEstudio: '',
  enderecoEstudio: '',
  biografia: '',
  estiloPrincipal: 'Fine Line',
};

export function TelaAutenticacao({
  onComplete,
  sessaoAuth,
  dadosIncompletos,
  onLogout,
}: PropsTelaAutenticacao) {
  const [etapa, setEtapa] = useState<EtapaAutenticacao>(() => {
    if (sessaoAuth || dadosIncompletos) return 'completarPerfil';
    return 'boasVindas';
  });
  const [modo, setModo] = useState<ModoAutenticacao>('cadastro');
  const [tipoPerfil, setTipoPerfil] = useState<TipoPerfil>(() => {
    const role = dadosIncompletos?.tipo_perfil || dadosIncompletos?.tipoPerfil || dadosIncompletos?.role;
    return role === 'artista' ? 'artista' : 'cliente';
  });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [formulario, setFormulario] = useState<FormularioCadastro>(() => {
    return {
      nomeCompleto: dadosIncompletos?.nome_exibicao || sessaoAuth?.nome || '',
      email: sessaoAuth?.email || dadosIncompletos?.email || '',
      telefone: dadosIncompletos?.telefone || '',
      cidade: dadosIncompletos?.cidade || '',
      senha: '',
      nomeEstudio: dadosIncompletos?.nome_estudio || '',
      enderecoEstudio: dadosIncompletos?.endereco_estudio || '',
      biografia: dadosIncompletos?.biografia || '',
      estiloPrincipal: dadosIncompletos?.estilo_principal || 'Fine Line',
    };
  });
  const [userIdAtivo, setUserIdAtivo] = useState<string>(() => sessaoAuth?.id || dadosIncompletos?.id || '');
  const [userFotoUrl, setUserFotoUrl] = useState<string>(
    () => sessaoAuth?.fotoUrl || dadosIncompletos?.foto_url || ''
  );

  // Sincroniza se novas props de sessão chegarem
  useEffect(() => {
    if (sessaoAuth || dadosIncompletos) {
      setEtapa('completarPerfil');
      if (sessaoAuth?.id) setUserIdAtivo(sessaoAuth.id);
      if (dadosIncompletos?.id) setUserIdAtivo(dadosIncompletos.id);
      if (sessaoAuth?.fotoUrl) setUserFotoUrl(sessaoAuth.fotoUrl);
      if (dadosIncompletos?.foto_url) setUserFotoUrl(dadosIncompletos.foto_url);

      const role = dadosIncompletos?.tipo_perfil || dadosIncompletos?.tipoPerfil || dadosIncompletos?.role;
      if (role === 'artista') {
        setTipoPerfil('artista');
      }

      setFormulario((prev) => ({
        ...prev,
        nomeCompleto: prev.nomeCompleto || dadosIncompletos?.nome_exibicao || sessaoAuth?.nome || '',
        email: prev.email || sessaoAuth?.email || dadosIncompletos?.email || '',
        telefone: prev.telefone || dadosIncompletos?.telefone || '',
        cidade: prev.cidade || dadosIncompletos?.cidade || '',
        nomeEstudio: prev.nomeEstudio || dadosIncompletos?.nome_estudio || '',
        enderecoEstudio: prev.enderecoEstudio || dadosIncompletos?.endereco_estudio || '',
        biografia: prev.biografia || dadosIncompletos?.biografia || '',
        estiloPrincipal: prev.estiloPrincipal || dadosIncompletos?.estilo_principal || 'Fine Line',
      }));
    }
  }, [sessaoAuth, dadosIncompletos]);

  // Calcula em tempo real quais campos ainda faltam
  const statusCompletude = useMemo(() => {
    return verificarStatusPerfil(
      {
        tipo_perfil: tipoPerfil,
        nome_exibicao: formulario.nomeCompleto,
        telefone: formulario.telefone,
        cidade: formulario.cidade,
        nome_estudio: formulario.nomeEstudio,
        endereco_estudio: formulario.enderecoEstudio,
        biografia: formulario.biografia,
        estilo_principal: formulario.estiloPrincipal,
      },
      tipoPerfil
    );
  }, [formulario, tipoPerfil]);

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

  // Salva no banco de dados Supabase
  const salvarPerfilNoBanco = async (id: string, email: string, fotoUrl?: string) => {
    const nomeFinal = formulario.nomeCompleto.trim() || email.split('@')[0] || 'Usuário';

    const payloadDB = {
      id,
      email: email.trim().toLowerCase(),
      nome_exibicao: nomeFinal,
      tipo_perfil: tipoPerfil,
      telefone: formulario.telefone.trim() || null,
      cidade: formulario.cidade.trim() || null,
      foto_url: fotoUrl || userFotoUrl || null,
      nome_estudio: tipoPerfil === 'artista' ? (formulario.nomeEstudio.trim() || 'Estúdio Particular') : null,
      endereco_estudio: tipoPerfil === 'artista' ? (formulario.enderecoEstudio.trim() || null) : null,
      biografia: tipoPerfil === 'artista' ? (formulario.biografia.trim() || null) : null,
      estilo_principal: tipoPerfil === 'artista' ? (formulario.estiloPrincipal.trim() || 'Fine Line') : null,
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
        // Redirecionamento no navegador em andamento
        return;
      }

      // Verifica se já existe perfil cadastrado com dados essenciais no banco
      const { data: profileExistente } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      const nomeGoogle = user.user_metadata?.full_name || user.user_metadata?.name || '';
      const emailGoogle = user.email || '';
      const fotoGoogle = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

      const statusVerificacao = verificarStatusPerfil(profileExistente, profileExistente?.tipo_perfil);

      // Se o perfil já existe e está 100% completo, entra direto
      if (profileExistente && statusVerificacao.completo) {
        onComplete(normalizarPerfil(profileExistente));
        return;
      }

      // Se estiver incompleto ou for primeiro acesso, prepara para completar
      setUserIdAtivo(user.id);
      setUserFotoUrl(fotoGoogle);
      setFormulario((prev) => ({
        ...prev,
        nomeCompleto: profileExistente?.nome_exibicao || nomeGoogle || prev.nomeCompleto,
        email: emailGoogle || prev.email,
        telefone: profileExistente?.telefone || prev.telefone,
        cidade: profileExistente?.cidade || prev.cidade,
        nomeEstudio: profileExistente?.nome_estudio || prev.nomeEstudio,
        enderecoEstudio: profileExistente?.endereco_estudio || prev.enderecoEstudio,
        biografia: profileExistente?.biografia || prev.biografia,
        estiloPrincipal: profileExistente?.estilo_principal || prev.estiloPrincipal || 'Fine Line',
      }));

      if (profileExistente?.tipo_perfil === 'artista') {
        setTipoPerfil('artista');
      } else {
        setTipoPerfil('cliente');
      }

      setEtapa('completarPerfil');
    } catch (err: any) {
      setErro(err.message || 'Erro ao realizar login com Google.');
    } finally {
      setCarregando(false);
    }
  };

  // Finalizar preenchimento do perfil com validação completa
  const handleFinalizarCompletarPerfil = async () => {
    if (!statusCompletude.completo) {
      const primeiro = statusCompletude.camposFaltantes[0];
      setErro(`Dado pendente: ${primeiro.label} - ${primeiro.descricao}`);
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
        const redirectOrigin =
          typeof window !== 'undefined' && window.location?.origin
            ? window.location.origin
            : AUTH_REDIRECT_URL;
        const emailRedirectTo = `${redirectOrigin.replace(/\/+$/, '')}/auth/callback`;

        const { data, error: erroCadastro } = await supabase.auth.signUp({
          email: emailFormatado,
          password: formulario.senha,
          options: {
            emailRedirectTo,
            data: {
              nome_exibicao: formulario.nomeCompleto,
              full_name: formulario.nomeCompleto,
              tipo_perfil: tipoPerfil,
              telefone: formulario.telefone,
              cidade: formulario.cidade,
            },
          },
        });

        if (erroCadastro) throw erroCadastro;
        if (!data.user) throw new Error('Usuário não retornado no cadastro.');

        const perfilSalvo = await salvarPerfilNoBanco(data.user.id, emailFormatado);
        
        // Verifica se ainda faltam campos
        const status = verificarStatusPerfil(perfilSalvo, tipoPerfil);
        if (status.completo) {
          onComplete(perfilSalvo);
        } else {
          setUserIdAtivo(data.user.id);
          setEtapa('completarPerfil');
        }
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

        const status = verificarStatusPerfil(dbProfile, dbProfile?.tipo_perfil);

        if (dbProfile && status.completo) {
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
          cidade: dbProfile?.cidade || prev.cidade,
          nomeEstudio: dbProfile?.nome_estudio || prev.nomeEstudio,
          enderecoEstudio: dbProfile?.endereco_estudio || prev.enderecoEstudio,
          biografia: dbProfile?.biografia || prev.biografia,
          estiloPrincipal: dbProfile?.estilo_principal || prev.estiloPrincipal || 'Fine Line',
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

  const handleSairOuTrocarConta = async () => {
    setCarregando(true);
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await supabase.auth.signOut();
      }
      setEtapa('boasVindas');
      setFormulario(FORMULARIO_INICIAL);
      setUserIdAtivo('');
      setUserFotoUrl('');
    } catch {
      // silencioso
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
        <TouchableOpacity
          style={[styles.buttonBase, styles.buttonGhost]}
          activeOpacity={0.85}
          onPress={() => selecionarModo('login')}
        >
          <Text style={[styles.buttonTextBase, styles.buttonTextLight]}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonBase, styles.buttonPrimary]}
          activeOpacity={0.85}
          onPress={() => selecionarModo('cadastro')}
        >
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
          <Text style={styles.roleDescription}>Buscando artes autorais e agendando sessões.</Text>
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
          <Text style={styles.roleTitle}>Tatuador / Estúdio</Text>
          <Text style={styles.roleDescription}>Publicando flashes, portfólio e gerindo agenda.</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.rowButtons}>
        <TouchableOpacity
          style={[styles.buttonBase, styles.buttonGhost, styles.growOne]}
          onPress={() => setEtapa('boasVindas')}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonTextBase, styles.buttonTextLight]}>Voltar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonBase, styles.buttonPrimary, styles.growTwo]}
          onPress={seguirParaFormulario}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const isCampoFaltante = (campo: string) => {
    return statusCompletude.camposFaltantes.some((f: CampoFaltante) => f.campo === campo);
  };

  const renderInput = (
    chave: keyof FormularioCadastro,
    label: string,
    placeholder: string,
    IconComp: React.ComponentType<{ size: number; color: string }>,
    opcoes?: {
      secure?: boolean;
      multiline?: boolean;
      keyboardType?: 'default' | 'email-address' | 'phone-pad';
      autoCapitalize?: 'none' | 'sentences' | 'words';
      editable?: boolean;
      obrigatorio?: boolean;
    }
  ) => {
    const pendente = opcoes?.obrigatorio && isCampoFaltante(chave);

    return (
      <View style={styles.inputContainer}>
        <View style={styles.inputLabelRow}>
          <Text style={styles.inputLabelText}>
            {label} {opcoes?.obrigatorio ? <Text style={styles.requiredStar}>*</Text> : null}
          </Text>
          {pendente ? <Text style={styles.inputPendenteTag}>Pendente</Text> : null}
        </View>

        <View style={styles.inputWrap}>
          {!opcoes?.multiline && (
            <View style={styles.inputIcon}>
              <IconComp size={18} color={pendente ? '#f3c21a' : '#6f6f6f'} />
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
              pendente ? styles.inputPendenteBorder : null,
              opcoes?.editable === false ? styles.inputDisabled : null,
            ]}
            multiline={opcoes?.multiline}
            textAlignVertical={opcoes?.multiline ? 'top' : 'center'}
          />
        </View>
      </View>
    );
  };

  // Tela dedicada para completar dados com indicador do que falta
  const renderCompletarPerfil = () => {
    const totalFaltantes = statusCompletude.camposFaltantes.length;

    return (
      <View style={styles.sectionStack}>
        {/* Header com avatar se houver */}
        <View style={styles.completeHeader}>
          {userFotoUrl ? (
            <Image source={{ uri: userFotoUrl }} style={styles.userAvatarImg} />
          ) : (
            <View style={styles.userAvatarFallback}>
              <User size={24} color="#f3c21a" />
            </View>
          )}
          <View style={styles.completeHeaderTextWrap}>
            <Text style={styles.screenTitle}>Complete seu Perfil</Text>
            <Text style={styles.screenMeta}>
              {formulario.email ? `Conectado como ${formulario.email}` : 'Quase lá! Finalize seus dados'}
            </Text>
          </View>
        </View>

        {erro ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#ef4444" />
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}

        {/* Banner do que falta preencher */}
        <View
          style={[
            styles.statusBanner,
            totalFaltantes > 0 ? styles.statusBannerPending : styles.statusBannerSuccess,
          ]}
        >
          <View style={styles.statusBannerHead}>
            {totalFaltantes > 0 ? (
              <>
                <AlertCircle size={18} color="#f3c21a" />
                <Text style={styles.statusBannerTitle}>
                  Faltam {totalFaltantes} {totalFaltantes === 1 ? 'informação' : 'informações'} para ativar seu perfil
                </Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} color="#22c55e" />
                <Text style={[styles.statusBannerTitle, { color: '#22c55e' }]}>
                  Tudo pronto! Seu perfil está completo
                </Text>
              </>
            )}
          </View>

          {totalFaltantes > 0 && (
            <View style={styles.badgesWrap}>
              {statusCompletude.camposFaltantes.map((item) => (
                <View key={item.campo} style={styles.missingBadge}>
                  <Text style={styles.missingBadgeText}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 1. SELEÇÃO DE PERFIL (CLIENTE OU TATUADOR) */}
        <View style={styles.roleSectionWrap}>
          <Text style={styles.sectionLabel}>Qual é o seu objetivo no Dermys?</Text>
          <View style={styles.roleCardRow}>
            <TouchableOpacity
              style={[
                styles.roleSelectCard,
                tipoPerfil === 'cliente' ? styles.roleSelectCardActive : styles.roleSelectCardIdle,
              ]}
              activeOpacity={0.85}
              onPress={() => setTipoPerfil('cliente')}
            >
              <Compass size={22} color={tipoPerfil === 'cliente' ? '#f3c21a' : '#888'} />
              <Text
                style={[
                  styles.roleSelectTitle,
                  tipoPerfil === 'cliente' ? styles.roleSelectTitleActive : null,
                ]}
              >
                Sou Cliente
              </Text>
              <Text style={styles.roleSelectSubtitle}>Tatuar & Agendar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.roleSelectCard,
                tipoPerfil === 'artista' ? styles.roleSelectCardActive : styles.roleSelectCardIdle,
              ]}
              activeOpacity={0.85}
              onPress={() => setTipoPerfil('artista')}
            >
              <Palette size={22} color={tipoPerfil === 'artista' ? '#f3c21a' : '#888'} />
              <Text
                style={[
                  styles.roleSelectTitle,
                  tipoPerfil === 'artista' ? styles.roleSelectTitleActive : null,
                ]}
              >
                Sou Tatuador
              </Text>
              <Text style={styles.roleSelectSubtitle}>Estúdio & Flashes</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. CAMPOS DO FORMULÁRIO */}
        <View style={styles.inputStack}>
          {renderInput(
            'nomeCompleto',
            tipoPerfil === 'artista' ? 'Nome Artístico / Completo' : 'Seu Nome Completo',
            'Como você quer ser chamado',
            User,
            { autoCapitalize: 'words', obrigatorio: true }
          )}

          {renderInput('email', 'E-mail da Conta', 'exemplo@gmail.com', Mail, {
            editable: false,
          })}

          {renderInput(
            'telefone',
            tipoPerfil === 'artista' ? 'WhatsApp Comercial' : 'Telefone / WhatsApp',
            '(11) 98888-8888',
            Phone,
            { keyboardType: 'phone-pad', obrigatorio: true }
          )}

          {renderInput(
            'cidade',
            'Cidade / Região de Atuação',
            'Ex: São Paulo, SP ou Curitiba, PR',
            MapPin,
            { autoCapitalize: 'words', obrigatorio: true }
          )}

          {/* CAMPOS ESPECÍFICOS PARA TATUADOR */}
          {tipoPerfil === 'artista' && (
            <>
              {renderInput(
                'nomeEstudio',
                'Nome do Estúdio / Coworking',
                'Ex: Dark Art Studio ou Atendimento Particular',
                Building,
                { autoCapitalize: 'words', obrigatorio: true }
              )}

              {renderInput(
                'enderecoEstudio',
                'Endereço do Atendimento',
                'Ex: Rua Augusta, 1200 - Consolação',
                MapPin,
                { autoCapitalize: 'sentences', obrigatorio: true }
              )}

              {/* Seletor de Estilo Principal */}
              <View style={styles.inputContainer}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabelText}>
                    Estilo Principal <Text style={styles.requiredStar}>*</Text>
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylePillsScroll}>
                  {ESTILOS_DISPONIVEIS.map((estilo) => {
                    const ativo = formulario.estiloPrincipal === estilo;
                    return (
                      <TouchableOpacity
                        key={estilo}
                        onPress={() => setFormulario((prev) => ({ ...prev, estiloPrincipal: estilo }))}
                        style={[styles.stylePill, ativo ? styles.stylePillActive : styles.stylePillIdle]}
                        activeOpacity={0.85}
                      >
                        {ativo && <Sparkles size={12} color="#111" />}
                        <Text style={[styles.stylePillText, ativo ? styles.stylePillTextActive : styles.stylePillTextIdle]}>
                          {estilo}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {renderInput(
                'biografia',
                'Biografia & Apresentação',
                'Conte um pouco sobre seu trabalho, técnicas e experiência...',
                AlignLeft,
                { multiline: true, autoCapitalize: 'sentences', obrigatorio: true }
              )}
            </>
          )}
        </View>

        {/* 3. BOTÃO DE SALVAR */}
        <TouchableOpacity
          onPress={handleFinalizarCompletarPerfil}
          disabled={carregando}
          style={[styles.buttonBase, styles.buttonPrimary, carregando ? styles.buttonDisabled : null]}
          activeOpacity={0.85}
        >
          {carregando ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>
              Salvar e Entrar no Dermys
            </Text>
          )}
        </TouchableOpacity>

        {/* Opção para deslogar / trocar de conta */}
        <TouchableOpacity
          onPress={handleSairOuTrocarConta}
          disabled={carregando}
          style={styles.switchAccountBtn}
          activeOpacity={0.8}
        >
          <LogOut size={14} color="#777" />
          <Text style={styles.switchAccountText}>Trocar de conta ou Sair</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderAutenticacao = () => (
    <View style={styles.sectionStack}>
      <View style={styles.headerWrap}>
        <Text style={styles.screenTitle}>{titulo}</Text>
        <Text style={styles.screenMeta}>Como {tipoPerfil === 'artista' ? 'Tatuador' : 'Cliente'}</Text>
      </View>

      {erro ? (
        <View style={styles.errorBanner}>
          <AlertCircle size={16} color="#ef4444" />
          <Text style={styles.errorText}>{erro}</Text>
        </View>
      ) : null}

      <View style={styles.inputStack}>
        {etapa === 'cadastro'
          ? renderInput('nomeCompleto', 'Nome Completo', 'Seu nome completo', User, {
              autoCapitalize: 'words',
              obrigatorio: true,
            })
          : null}

        {renderInput('email', 'E-mail', 'seuemail@exemplo.com', Mail, {
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          obrigatorio: true,
        })}

        {etapa === 'cadastro'
          ? renderInput('telefone', 'Telefone / WhatsApp', '(11) 98888-8888', Phone, {
              keyboardType: 'phone-pad',
              obrigatorio: true,
            })
          : null}

        {etapa === 'cadastro'
          ? renderInput('cidade', 'Cidade / Região', 'Ex: São Paulo, SP', MapPin, {
              autoCapitalize: 'words',
              obrigatorio: true,
            })
          : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista'
          ? renderInput('nomeEstudio', 'Nome do Estúdio', 'Nome do estúdio', Building, {
              autoCapitalize: 'words',
              obrigatorio: true,
            })
          : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista'
          ? renderInput('enderecoEstudio', 'Endereço do Estúdio', 'Endereço do estúdio', MapPin, {
              autoCapitalize: 'sentences',
              obrigatorio: true,
            })
          : null}

        {etapa === 'cadastro' && tipoPerfil === 'artista'
          ? renderInput('biografia', 'Biografia', 'Sua bio / descrição curta', AlignLeft, {
              multiline: true,
              autoCapitalize: 'sentences',
              obrigatorio: true,
            })
          : null}

        {renderInput('senha', etapa === 'cadastro' ? 'Criar Senha' : 'Sua Senha', 'Mínimo 6 caracteres', Lock, {
          secure: true,
          autoCapitalize: 'none',
          obrigatorio: true,
        })}
      </View>

      <View style={styles.actionsWrap}>
        <TouchableOpacity
          onPress={enviarFormulario}
          disabled={carregando}
          style={[styles.buttonBase, styles.buttonPrimary, carregando ? styles.buttonDisabled : null]}
          activeOpacity={0.85}
        >
          {carregando ? (
            <ActivityIndicator color="#111" />
          ) : (
            <Text style={[styles.buttonTextBase, styles.buttonTextDark]}>
              {etapa === 'login' ? 'Entrar' : 'Finalizar Registro'}
            </Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20, justifyContent: 'center' },
  sectionCenter: { gap: 24 },
  sectionStack: { gap: 18 },
  brandWrap: { alignItems: 'center', gap: 16 },
  brandTextWrap: { alignItems: 'center', gap: 2 },
  brandTitle: { color: '#f3c21a', fontSize: 52, fontWeight: '900', textTransform: 'uppercase', letterSpacing: -2, lineHeight: 52 },
  brandSubTitle: { color: '#f5f5f5', textTransform: 'uppercase', fontSize: 12, fontWeight: '800', letterSpacing: 2.2 },
  headerWrap: { gap: 6 },
  screenTitle: { color: '#f3c21a', fontSize: 26, fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: -1 },
  screenMeta: { color: '#888', textTransform: 'uppercase', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  completeHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  completeHeaderTextWrap: { flex: 1, gap: 4 },
  userAvatarImg: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#f3c21a' },
  userAvatarFallback: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#181818', borderWidth: 1, borderColor: '#333', justifyContent: 'center', alignItems: 'center' },
  statusBanner: { borderRadius: 14, padding: 14, gap: 10, borderWidth: 1 },
  statusBannerPending: { backgroundColor: 'rgba(243, 194, 26, 0.08)', borderColor: 'rgba(243, 194, 26, 0.3)' },
  statusBannerSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.08)', borderColor: 'rgba(34, 197, 94, 0.3)' },
  statusBannerHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBannerTitle: { color: '#f3c21a', fontSize: 13, fontWeight: '800' },
  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  missingBadge: { backgroundColor: '#1e1b12', borderWidth: 1, borderColor: '#f3c21a66', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  missingBadgeText: { color: '#f3c21a', fontSize: 11, fontWeight: '700' },
  roleSectionWrap: { gap: 8 },
  sectionLabel: { color: '#999', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  roleCardRow: { flexDirection: 'row', gap: 10 },
  roleSelectCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4 },
  roleSelectCardIdle: { backgroundColor: '#101010', borderColor: '#222' },
  roleSelectCardActive: { backgroundColor: '#191811', borderColor: '#f3c21a' },
  roleSelectTitle: { color: '#888', fontSize: 14, fontWeight: '800' },
  roleSelectTitleActive: { color: '#fff' },
  roleSelectSubtitle: { color: '#666', fontSize: 10, fontWeight: '600' },
  actionsWrap: { gap: 12 },
  rowButtons: { flexDirection: 'row', gap: 12 },
  growOne: { flex: 1 },
  growTwo: { flex: 2 },
  buttonBase: { minHeight: 54, borderRadius: 14, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, paddingHorizontal: 16 },
  buttonGhost: { backgroundColor: '#1d1d1d', borderWidth: 1, borderColor: '#2d2d2d' },
  buttonPrimary: { backgroundColor: '#f3c21a' },
  buttonGoogle: { backgroundColor: '#ffffff' },
  buttonDisabled: { opacity: 0.6 },
  buttonTextBase: { fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  buttonTextDark: { color: '#111' },
  buttonTextLight: { color: '#fff' },
  buttonTextGoogle: { color: '#1f2937' },
  separatorWrap: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  separatorLine: { flex: 1, height: 1, backgroundColor: '#222' },
  separatorText: { color: '#666', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
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
  inputStack: { gap: 12 },
  inputContainer: { gap: 6 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputLabelText: { color: '#aaa', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  requiredStar: { color: '#f3c21a', fontWeight: '900' },
  inputPendenteTag: { color: '#f3c21a', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  inputIcon: { position: 'absolute', left: 16, zIndex: 2 },
  input: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222',
    color: '#fff',
    fontSize: 14,
    paddingHorizontal: 16,
  },
  inputWithIcon: { paddingLeft: 46 },
  inputMultiline: { minHeight: 74, paddingVertical: 12 },
  inputPendenteBorder: { borderColor: 'rgba(243, 194, 26, 0.4)' },
  inputDisabled: { backgroundColor: '#0c0c0c', color: '#888', borderColor: '#1a1a1a' },
  stylePillsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  stylePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  stylePillIdle: { backgroundColor: '#121212', borderColor: '#262626' },
  stylePillActive: { backgroundColor: '#f3c21a', borderColor: '#f3c21a' },
  stylePillText: { fontSize: 12, fontWeight: '700' },
  stylePillTextIdle: { color: '#888' },
  stylePillTextActive: { color: '#111' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', borderRadius: 10, padding: 10 },
  errorText: { color: '#ef4444', fontSize: 12, fontWeight: '700', flex: 1 },
  backLink: { alignItems: 'center', paddingVertical: 6 },
  backLinkText: { color: '#777', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  switchAccountBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, paddingVertical: 10 },
  switchAccountText: { color: '#777', fontSize: 12, fontWeight: '700' },
});
