import { avisar } from '@/services/feedback';
import { ds } from '@/theme/design-system';
import { AppModal } from '@/components/ui/app-modal';
import { selecionarImagemGaleria } from '@/services/image-picker-helper';
import { PortfolioService } from '@/services/portfolio-service';
import { supabase } from '@/services/data-client';
import { confirmarAcao } from '@/services/feedback';
import type { ItemPortfolio } from '@/types/artista-detalhado';
import type { PerfilUsuario } from '@/types/auth';
import { BotaoAlternarTema, createThemedStyles, tc } from '@/theme';
import {
  Building,
  Camera,
  Check,
  CreditCard,
  Edit3,
  FileCheck2,
  Image as ImageIcon,
  Mail,
  MapPin,
  Maximize2,
  Palette,
  Phone,
  Plus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

const ESTILOS_DISPONIVEIS = [
  'Fine Line',
  'Blackwork',
  'Realismo',
  'Old School',
  'Aquarela',
  'Geek',
  'Oriental',
  'Tribal / Maori',
];

interface PropsPerfilTab {
  perfil: PerfilUsuario;
  onAtualizarPerfil?: (novoPerfil: PerfilUsuario) => void;
}

export function ArtistaPerfilTab({ perfil, onAtualizarPerfil }: PropsPerfilTab) {
  const artistaId = perfil.id || perfil.uid || '11111111-1111-1111-1111-111111111111';

  // Estados do portfólio
  const [obras, setObras] = useState<ItemPortfolio[]>([]);
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [modalNovaObraAberto, setModalNovaObraAberto] = useState(false);
  const [obraZoom, setObraZoom] = useState<ItemPortfolio | null>(null);

  // Form nova obra
  const [novaImagemUrl, setNovaImagemUrl] = useState('');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoEstilo, setNovoEstilo] = useState(perfil.estilo_principal || 'Fine Line');
  const [novoPreco, setNovoPreco] = useState('');
  const [novoDisponivel, setNovoDisponivel] = useState(true);
  const [novaDescricao, setNovaDescricao] = useState('');
  const [salvandoObra, setSalvandoObra] = useState(false);

  // Estados de alteração de foto de perfil
  const [modalFotoAberto, setModalFotoAberto] = useState(false);
  const [urlFotoTemporaria, setUrlFotoTemporaria] = useState('');
  const [salvandoFoto, setSalvandoFoto] = useState(false);

  // Estados de edição de dados do perfil
  const [modalDadosAberto, setModalDadosAberto] = useState(false);
  const [salvandoDados, setSalvandoDados] = useState(false);
  const [formNome, setFormNome] = useState(perfil.nome_exibicao || perfil.nomeExibicao || '');
  const [formEstudio, setFormEstudio] = useState(perfil.nome_estudio || perfil.nomeEstudio || '');
  const [formEndereco, setFormEndereco] = useState(perfil.endereco_estudio || perfil.enderecoEstudio || '');
  const [formCidade, setFormCidade] = useState(perfil.cidade || '');
  const [formTelefone, setFormTelefone] = useState(perfil.telefone || '');
  const [formEstilo, setFormEstilo] = useState(perfil.estilo_principal || 'Fine Line');
  const [formPrecoInicial, setFormPrecoInicial] = useState(String(perfil.preco_inicial || 350));
  const [formBio, setFormBio] = useState(perfil.biografia || perfil.bio || '');
  const [formPix, setFormPix] = useState(perfil.chave_pix || '');
  const [formRegime, setFormRegime] = useState(perfil.regime_tributario || 'MEI');
  const [formSinal, setFormSinal] = useState(String(perfil.percentual_sinal || 30));

  // Feedback visual rápido
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const exibirAlerta = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Carrega portfólio inicial do artista
  useEffect(() => {
    carregarPortfolio();
  }, [artistaId]);

  const carregarPortfolio = async () => {
    setCarregandoObras(true);
    try {
      const lista = await PortfolioService.carregarPortfolioArtista(artistaId);
      setObras(lista);
    } catch {
      // silencioso
    } finally {
      setCarregandoObras(false);
    }
  };

  // 1. AÇÃO: Escolher imagem da galeria para nova obra
  const handleSelecionarImagemGaleriaNovaObra = async () => {
    const uri = await selecionarImagemGaleria();
    if (uri) {
      setNovaImagemUrl(uri);
    }
  };

  // 2. AÇÃO: Salvar nova obra no portfólio
  const handleSalvarNovaObra = async () => {
    if (!novaImagemUrl.trim()) {
      avisar('Selecione ou insira uma imagem para a obra.');
      return;
    }
    if (!novoTitulo.trim()) {
      avisar('Dê um título à obra (ex: Floral Botânico).');
      return;
    }

    setSalvandoObra(true);
    try {
      const precoNum = novoPreco ? parseFloat(novoPreco.replace(',', '.')) : undefined;

      const criada = await PortfolioService.adicionarObra({
        artistaId,
        titulo: novoTitulo,
        imagemUrl: novaImagemUrl,
        estilo: novoEstilo,
        preco: precoNum,
        disponivel: novoDisponivel,
        descricao: novaDescricao,
      });

      setObras((prev) => [criada, ...prev]);
      setModalNovaObraAberto(false);
      setNovaImagemUrl('');
      setNovoTitulo('');
      setNovoPreco('');
      setNovaDescricao('');
      exibirAlerta('Obra publicada com sucesso! Ela já aparece no Explorar.');
    } catch (err) {
      console.warn('Erro ao salvar obra:', err);
      avisar('Não foi possível salvar a obra. Tente novamente.');
    } finally {
      setSalvandoObra(false);
    }
  };

  // 3. AÇÃO: Remover obra do portfólio
  const handleRemoverObra = async (obraId: string) => {
    const confirmar = await confirmarAcao('Deseja realmente remover esta obra do seu portfólio?');

    if (!confirmar) return;

    try {
      await PortfolioService.removerObra(obraId, artistaId);
      setObras((prev) => prev.filter((o) => o.id !== obraId));
      exibirAlerta('Obra removida do portfólio.');
    } catch {
      avisar('Erro ao remover obra.');
    }
  };

  // 4. AÇÃO: Alterar foto de perfil
  const handleSelecionarFotoPerfilGaleria = async () => {
    const uri = await selecionarImagemGaleria();
    if (uri) {
      setUrlFotoTemporaria(uri);
    }
  };

  const handleSalvarFotoPerfil = async () => {
    if (!urlFotoTemporaria.trim()) {
      avisar('Escolha ou insira a URL da foto de perfil.');
      return;
    }

    setSalvandoFoto(true);
    try {
      const fotoFinal = urlFotoTemporaria.trim();

      // Atualiza Supabase
      {
        const { data, error } = await supabase
          .from('profiles')
          .update({ foto_url: fotoFinal })
          .eq('id', artistaId).select('id').single();
        if (error || !data) throw new Error('Não foi possível salvar a foto.');
      }

      const atualizado: PerfilUsuario = {
        ...perfil,
        foto_url: fotoFinal,
        fotoUrl: fotoFinal,
      };

      if (onAtualizarPerfil) {
        onAtualizarPerfil(atualizado);
      }

      setModalFotoAberto(false);
      setUrlFotoTemporaria('');
      exibirAlerta('Foto de perfil atualizada!');
    } catch {
      avisar('Erro ao atualizar foto de perfil.');
    } finally {
      setSalvandoFoto(false);
    }
  };

  // 5. AÇÃO: Salvar alterações de dados do perfil
  const handleSalvarDadosPerfil = async () => {
    setSalvandoDados(true);
    try {
      const precoNum = parseFloat(formPrecoInicial.replace(',', '.')) || 350;
      const sinalNum = parseInt(formSinal, 10) || 30;

      const payloadDb = {
        nome_exibicao: formNome.trim(),
        nome_estudio: formEstudio.trim(),
        endereco_estudio: formEndereco.trim(),
        cidade: formCidade.trim(),
        telefone: formTelefone.trim(),
        estilo_principal: formEstilo.trim(),
        preco_inicial: precoNum,
        biografia: formBio.trim(),
        chave_pix: formPix.trim(),
        regime_tributario: formRegime.trim(),
        percentual_sinal: sinalNum,
      };

      {
        const { data, error } = await supabase
          .from('profiles')
          .update(payloadDb)
          .eq('id', artistaId).select('id').single();
        if (error || !data) throw new Error('Não foi possível salvar os dados.');
      }

      const atualizado: PerfilUsuario = {
        ...perfil,
        nome_exibicao: formNome.trim(),
        nomeExibicao: formNome.trim(),
        nome_estudio: formEstudio.trim(),
        nomeEstudio: formEstudio.trim(),
        endereco_estudio: formEndereco.trim(),
        enderecoEstudio: formEndereco.trim(),
        cidade: formCidade.trim(),
        telefone: formTelefone.trim(),
        estilo_principal: formEstilo.trim(),
        preco_inicial: precoNum,
        precoInicial: precoNum,
        biografia: formBio.trim(),
        bio: formBio.trim(),
        chave_pix: formPix.trim(),
        regime_tributario: formRegime.trim(),
        percentual_sinal: sinalNum,
      };

      if (onAtualizarPerfil) {
        onAtualizarPerfil(atualizado);
      }

      setModalDadosAberto(false);
      exibirAlerta('Dados do perfil salvos com sucesso!');
    } catch {
      avisar('Erro ao salvar dados do perfil.');
    } finally {
      setSalvandoDados(false);
    }
  };

  const fotoAtual = perfil.foto_url || perfil.fotoUrl || perfil.photoURL;

  return (
    <View style={styles.container}>
      {/* Toast de feedback */}
      {feedbackMsg && (
        <View style={styles.feedbackToast}>
          <Sparkles size={14} color={tc('#000')} />
          <Text style={styles.feedbackToastText}>{feedbackMsg}</Text>
        </View>
      )}

      {/* Header Perfil */}
      <View style={styles.profileHeader}>
        {/* Avatar com botão de alterar foto */}
        <View style={styles.avatarWrap}>
          {fotoAtual ? (
            <Image source={{ uri: fotoAtual }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatar}>
              <Palette size={32} color={tc(ds.cores.destaque)} />
            </View>
          )}

          <Pressable
            style={styles.changePhotoBtn}
            onPress={() => {
              setUrlFotoTemporaria(fotoAtual || '');
              setModalFotoAberto(true);
            }}
          >
            <Camera size={14} color={tc('#000')} />
          </Pressable>
        </View>

        <Text style={styles.name}>{perfil.nome_exibicao || perfil.nomeExibicao || 'Tatuador'}</Text>
        <Text style={styles.studio}>{perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio Particular'}</Text>
        
        <View style={styles.badgePro}>
          <ShieldCheck size={12} color={tc('#10b981')} />
          <Text style={styles.badgeProText}>Tatuador Verificado Dermys</Text>
        </View>

        {/* Botão de Editar Dados do Perfil */}
        <Pressable
          style={styles.btnEditarPerfil}
          onPress={() => {
            setFormNome(perfil.nome_exibicao || perfil.nomeExibicao || '');
            setFormEstudio(perfil.nome_estudio || perfil.nomeEstudio || '');
            setFormEndereco(perfil.endereco_estudio || perfil.enderecoEstudio || '');
            setFormCidade(perfil.cidade || '');
            setFormTelefone(perfil.telefone || '');
            setFormEstilo(perfil.estilo_principal || 'Fine Line');
            setFormPrecoInicial(String(perfil.preco_inicial || 350));
            setFormBio(perfil.biografia || perfil.bio || '');
            setFormPix(perfil.chave_pix || '');
            setFormRegime(perfil.regime_tributario || 'MEI');
            setFormSinal(String(perfil.percentual_sinal || 30));
            setModalDadosAberto(true);
          }}
        >
          <Edit3 size={13} color={tc(ds.cores.destaque)} />
          <Text style={styles.btnEditarPerfilText}>Editar Dados do Estúdio</Text>
        </Pressable>
      </View>

      {/* Aparência (modo claro / escuro) */}
      <BotaoAlternarTema />

      {/* SEÇÃO PRINCIPAL: PORTFÓLIO DE OBRAS & FLASHES */}
      <View style={styles.card}>
        <View style={styles.portfolioHeaderRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <ImageIcon size={18} color={tc(ds.cores.destaque)} />
              <Text style={styles.cardTitle}>Meu Portfólio & Flashes</Text>
            </View>
            <Text style={styles.portfolioSubtitle}>
              Visível para clientes no Explorar da sua região ({obras.length} obras)
            </Text>
          </View>

          <Pressable
            style={styles.btnAddObra}
            onPress={() => {
              setNovaImagemUrl('');
              setNovoTitulo('');
              setNovoPreco(String(perfil.preco_inicial || 350));
              setNovaDescricao('');
              setModalNovaObraAberto(true);
            }}
          >
            <Plus size={14} color={tc('#000')} />
            <Text style={styles.btnAddObraText}>Adicionar</Text>
          </Pressable>
        </View>

        {carregandoObras ? (
          <ActivityIndicator color={tc(ds.cores.destaque)} style={{ marginVertical: 20 }} />
        ) : obras.length === 0 ? (
          <View style={styles.emptyPortfolioBox}>
            <ImageIcon size={28} color={tc(ds.cores.textoSuave)} />
            <Text style={styles.emptyPortfolioTitle}>Nenhuma obra cadastrada ainda</Text>
            <Text style={styles.emptyPortfolioSub}>
              Adicione fotos de tatuagens e flashes autorais para aparecer no feed Explorar.
            </Text>
          </View>
        ) : (
          <View style={styles.portfolioGrid}>
            {obras.map((obra) => (
              <View key={obra.id} style={styles.portfolioCard}>
                <Pressable onPress={() => setObraZoom(obra)} style={styles.portfolioImgWrap}>
                  <Image source={{ uri: obra.imagemUrl }} style={styles.portfolioImg} />
                  
                  <View style={styles.zoomBtnMini}>
                    <Maximize2 size={11} color={tc(ds.cores.texto)} />
                  </View>

                  <Pressable
                    style={styles.deleteObraBtn}
                    onPress={() => handleRemoverObra(obra.id)}
                  >
                    <Trash2 size={12} color={tc('#ef4444')} />
                  </Pressable>
                </Pressable>

                <View style={styles.portfolioCardInfo}>
                  <Text style={styles.portfolioCardTitle} numberOfLines={1}>
                    {obra.titulo}
                  </Text>
                  
                  <View style={styles.portfolioBadgeRow}>
                    <View style={styles.tagEstiloPill}>
                      <Text style={styles.tagEstiloText}>{obra.estilo}</Text>
                    </View>
                    {obra.disponivel ? (
                      <View style={styles.tagDisponivelPill}>
                        <Text style={styles.tagDisponivelText}>Flash</Text>
                      </View>
                    ) : (
                      <View style={styles.tagCicatrizadaPill}>
                        <Text style={styles.tagCicatrizadaText}>Feita</Text>
                      </View>
                    )}
                  </View>

                  {obra.preco && (
                    <Text style={styles.portfolioPreco}>R$ {obra.preco}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Dados Fiscais & Recebimento */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <FileCheck2 size={16} color={tc(ds.cores.destaque)} />
          <Text style={styles.cardTitle}>Dados Fiscais & Pagamento</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Regime Tributário:</Text>
          <Text style={styles.itemValBold}>{perfil.regime_tributario || 'MEI'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Documento (CNPJ/CPF):</Text>
          <Text style={styles.itemVal}>{perfil.cpf_cnpj || '54.321.987/0001-23 (MEI)'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Chave PIX Mercado Pago:</Text>
          <Text style={styles.itemValHighlight}>{perfil.chave_pix || 'pix@tatuador.com.br'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Text style={styles.itemLabel}>Sinal de Reserva Padrão:</Text>
          <Text style={styles.itemValBold}>{perfil.percentual_sinal || 30}%</Text>
        </View>
      </View>

      {/* Dados do Estúdio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Localização & Contato</Text>

        <View style={styles.itemRow}>
          <Building size={14} color={tc(ds.cores.textoSuave)} />
          <Text style={styles.itemVal}>{perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio Particular'}</Text>
        </View>

        <View style={styles.itemRow}>
          <MapPin size={14} color={tc(ds.cores.textoSuave)} />
          <Text style={styles.itemVal}>{perfil.endereco_estudio || perfil.enderecoEstudio || 'Endereço não informado'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Phone size={14} color={tc(ds.cores.textoSuave)} />
          <Text style={styles.itemVal}>{perfil.telefone || '(11) 98888-8888'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Mail size={14} color={tc(ds.cores.textoSuave)} />
          <Text style={styles.itemVal}>{perfil.email}</Text>
        </View>
      </View>

      {/* Bio */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Especialidades & Biografia</Text>
        <Text style={styles.descText}>
          {perfil.biografia || perfil.bio || 'Especialista em tatuagens autorais de alta qualidade.'}
        </Text>
      </View>

      {/* ============================================================ */}
      {/* MODAL 1: ADICIONAR FOTO AO PORTFÓLIO */}
      {/* ============================================================ */}
      <AppModal
        visible={modalNovaObraAberto}
        transparent
        onRequestClose={() => setModalNovaObraAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Plus size={18} color={tc(ds.cores.destaque)} />
                <Text style={styles.modalTitle}>Adicionar Foto ao Portfólio</Text>
              </View>
              <Pressable onPress={() => setModalNovaObraAberto(false)}>
                <X size={20} color={tc(ds.cores.texto)} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              {/* Seleção de Imagem */}
              <View>
                <Text style={styles.inputLabel}>Foto da Tatuagem / Flash *</Text>
                
                {novaImagemUrl ? (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: novaImagemUrl }} style={styles.previewImg} />
                    <Pressable
                      style={styles.removePreviewBtn}
                      onPress={() => setNovaImagemUrl('')}
                    >
                      <X size={14} color={tc(ds.cores.texto)} />
                    </Pressable>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    <Pressable
                      style={styles.btnEscolherGaleria}
                      onPress={handleSelecionarImagemGaleriaNovaObra}
                    >
                      <Upload size={16} color={tc('#000')} />
                      <Text style={styles.btnEscolherGaleriaText}>Escolher da Galeria do Dispositivo</Text>
                    </Pressable>

                    <Text style={styles.orText}>ou cole o link direto da imagem:</Text>
                    
                    <TextInput
                      style={styles.input}
                      placeholder="https://exemplo.com/foto-tattoo.jpg"
                      placeholderTextColor={tc(ds.cores.textoSuave)}
                      value={novaImagemUrl}
                      onChangeText={setNovaImagemUrl}
                    />
                  </View>
                )}
              </View>

              {/* Título da Obra */}
              <View>
                <Text style={styles.inputLabel}>Título da Peça / Obra *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Serpente Floral Fine Line"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                  value={novoTitulo}
                  onChangeText={setNovoTitulo}
                />
              </View>

              {/* Seletor de Estilo */}
              <View>
                <Text style={styles.inputLabel}>Estilo Principal</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {ESTILOS_DISPONIVEIS.map((est) => {
                    const sel = novoEstilo === est;
                    return (
                      <Pressable
                        key={est}
                        style={[styles.estiloChip, sel && styles.estiloChipActive]}
                        onPress={() => setNovoEstilo(est)}
                      >
                        <Text style={[styles.estiloChipText, sel && styles.estiloChipTextActive]}>
                          {est}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Preço Estimado */}
              <View>
                <Text style={styles.inputLabel}>Preço Base / Orçamento Sugerido (R$)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 450"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                  keyboardType="numeric"
                  value={novoPreco}
                  onChangeText={setNovoPreco}
                />
              </View>

              {/* Disponibilidade para Flash */}
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.toggleLabel}>Disponível como Flash Autoral?</Text>
                  <Text style={styles.toggleSub}>
                    Se sim, clientes poderão clicar e reservar esta arte de imediato.
                  </Text>
                </View>
                <Pressable
                  style={[styles.toggleBtn, novoDisponivel && styles.toggleBtnActive]}
                  onPress={() => setNovoDisponivel((v) => !v)}
                >
                  <Text style={[styles.toggleBtnText, novoDisponivel && styles.toggleBtnTextActive]}>
                    {novoDisponivel ? 'SIM' : 'NÃO'}
                  </Text>
                </Pressable>
              </View>

              {/* Descrição Opcional */}
              <View>
                <Text style={styles.inputLabel}>Descrição / Detalhes (opcional)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Tamanho sugerido, local do corpo ideal, cicatrização..."
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                  multiline
                  value={novaDescricao}
                  onChangeText={setNovaDescricao}
                />
              </View>

              {/* Botão de Enviar */}
              <Pressable
                style={[styles.btnConfirmar, salvandoObra && { opacity: 0.7 }]}
                onPress={handleSalvarNovaObra}
                disabled={salvandoObra}
              >
                {salvandoObra ? (
                  <ActivityIndicator color={tc('#000')} />
                ) : (
                  <>
                    <Check size={16} color={tc('#000')} />
                    <Text style={styles.btnConfirmarText}>Publicar no Portfólio & Feed</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </AppModal>

      {/* ============================================================ */}
      {/* MODAL 2: ALTERAR FOTO DE PERFIL DO TATUADOR */}
      {/* ============================================================ */}
      <AppModal
        visible={modalFotoAberto}
        transparent
        onRequestClose={() => setModalFotoAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Camera size={18} color={tc(ds.cores.destaque)} />
                <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>
              </View>
              <Pressable onPress={() => setModalFotoAberto(false)}>
                <X size={20} color={tc(ds.cores.texto)} />
              </Pressable>
            </View>

            <View style={{ gap: 14 }}>
              {/* Preview */}
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                {urlFotoTemporaria ? (
                  <Image source={{ uri: urlFotoTemporaria }} style={styles.avatarPreviewModal} />
                ) : (
                  <View style={styles.avatarPreviewModalEmpty}>
                    <Camera size={36} color={tc(ds.cores.textoSuave)} />
                  </View>
                )}
              </View>

              <Pressable
                style={styles.btnEscolherGaleria}
                onPress={handleSelecionarFotoPerfilGaleria}
              >
                <Upload size={16} color={tc('#000')} />
                <Text style={styles.btnEscolherGaleriaText}>Escolher Foto da Galeria</Text>
              </Pressable>

              <Text style={styles.orText}>ou insira a URL direta da imagem:</Text>

              <TextInput
                style={styles.input}
                placeholder="https://exemplo.com/sua-foto.jpg"
                placeholderTextColor={tc(ds.cores.textoSuave)}
                value={urlFotoTemporaria}
                onChangeText={setUrlFotoTemporaria}
              />

              <Pressable
                style={[styles.btnConfirmar, salvandoFoto && { opacity: 0.7 }]}
                onPress={handleSalvarFotoPerfil}
                disabled={salvandoFoto}
              >
                {salvandoFoto ? (
                  <ActivityIndicator color={tc('#000')} />
                ) : (
                  <>
                    <Check size={16} color={tc('#000')} />
                    <Text style={styles.btnConfirmarText}>Salvar Foto de Perfil</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </AppModal>

      {/* ============================================================ */}
      {/* MODAL 3: EDITAR DADOS DO ESTÚDIO & PERFIL */}
      {/* ============================================================ */}
      <AppModal
        visible={modalDadosAberto}
        transparent
        onRequestClose={() => setModalDadosAberto(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Edit3 size={18} color={tc(ds.cores.destaque)} />
                <Text style={styles.modalTitle}>Editar Dados do Estúdio</Text>
              </View>
              <Pressable onPress={() => setModalDadosAberto(false)}>
                <X size={20} color={tc(ds.cores.texto)} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              <View>
                <Text style={styles.inputLabel}>Nome Artístico / Profissional *</Text>
                <TextInput
                  style={styles.input}
                  value={formNome}
                  onChangeText={setFormNome}
                  placeholder="Seu nome"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Nome do Estúdio *</Text>
                <TextInput
                  style={styles.input}
                  value={formEstudio}
                  onChangeText={setFormEstudio}
                  placeholder="Nome do estúdio ou 'Estúdio Particular'"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Endereço do Estúdio</Text>
                <TextInput
                  style={styles.input}
                  value={formEndereco}
                  onChangeText={setFormEndereco}
                  placeholder="Rua, número, bairro"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Cidade / Região (Feed Regional) *</Text>
                <TextInput
                  style={styles.input}
                  value={formCidade}
                  onChangeText={setFormCidade}
                  placeholder="São Paulo, SP"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={formTelefone}
                  onChangeText={setFormTelefone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Estilo Principal de Tatuagem</Text>
                <TextInput
                  style={styles.input}
                  value={formEstilo}
                  onChangeText={setFormEstilo}
                  placeholder="Fine Line, Blackwork..."
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Preço Inicial Base (R$)</Text>
                <TextInput
                  style={styles.input}
                  value={formPrecoInicial}
                  onChangeText={setFormPrecoInicial}
                  keyboardType="numeric"
                  placeholder="350"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Chave PIX (Mercado Pago / Recebimento)</Text>
                <TextInput
                  style={styles.input}
                  value={formPix}
                  onChangeText={setFormPix}
                  placeholder="chave@pix.com.br"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Percentual de Sinal Padrão (%)</Text>
                <TextInput
                  style={styles.input}
                  value={formSinal}
                  onChangeText={setFormSinal}
                  keyboardType="numeric"
                  placeholder="30"
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Biografia & Especialidades</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  value={formBio}
                  onChangeText={setFormBio}
                  placeholder="Fale sobre sua experiência, técnicas..."
                  placeholderTextColor={tc(ds.cores.textoSuave)}
                  multiline
                />
              </View>

              <Pressable
                style={[styles.btnConfirmar, salvandoDados && { opacity: 0.7 }]}
                onPress={handleSalvarDadosPerfil}
                disabled={salvandoDados}
              >
                {salvandoDados ? (
                  <ActivityIndicator color={tc('#000')} />
                ) : (
                  <>
                    <Check size={16} color={tc('#000')} />
                    <Text style={styles.btnConfirmarText}>Salvar Alterações</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </AppModal>

      {/* ============================================================ */}
      {/* MODAL 4: ZOOM DA FOTO DO PORTFÓLIO */}
      {/* ============================================================ */}
      {obraZoom && (
        <AppModal visible={!!obraZoom} transparent onRequestClose={() => setObraZoom(null)}>
          <View style={styles.zoomOverlay}>
            <Pressable style={styles.zoomCloseBtn} onPress={() => setObraZoom(null)}>
              <X size={20} color={tc(ds.cores.texto)} />
            </Pressable>
            <Image source={{ uri: obraZoom.imagemUrl }} style={styles.zoomImg} resizeMode="contain" />
            <View style={styles.zoomCard}>
              <Text style={styles.zoomCardTitle}>{obraZoom.titulo}</Text>
              <Text style={styles.zoomCardStyle}>
                {obraZoom.estilo} • {obraZoom.disponivel ? 'Flash Disponível' : 'Trabalho Realizado'}
              </Text>
              {obraZoom.preco && (
                <Text style={styles.zoomCardPrice}>R$ {obraZoom.preco}</Text>
              )}
              {obraZoom.descricao && (
                <Text style={styles.zoomCardDesc}>{obraZoom.descricao}</Text>
              )}
            </View>
          </View>
        </AppModal>
      )}
    </View>
  );
}

const styles = createThemedStyles({
  container: {
    gap: ds.espaco.secao,
  },
  feedbackToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ds.cores.destaque,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  feedbackToastText: {
    color: '#000',
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  profileHeader: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: ds.cores.destaque,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ds.cores.elevada,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: ds.cores.destaque,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101010',
  },
  name: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  studio: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  badgePro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  badgeProText: {
    color: '#10b981',
    fontSize: ds.fonte.etiqueta,
    fontWeight: '700',
    lineHeight: 16,
  },
  btnEditarPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: ds.cores.borda,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: ds.raio.controle,
    marginTop: 8,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnEditarPerfilText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  card: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.secao,
    fontWeight: '800',
    lineHeight: 26,
    flexShrink: 1,
  },
  portfolioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portfolioSubtitle: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.subtitulo,
    marginTop: 2,
    lineHeight: 23,
    flexShrink: 1,
  },
  btnAddObra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ds.cores.destaque,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: ds.raio.controle,
    minHeight: ds.alvo.controle,
    justifyContent: 'center',
  },
  btnAddObraText: {
    color: '#000',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  emptyPortfolioBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#141416',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#202024',
    borderStyle: 'dashed',
  },
  emptyPortfolioTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '700',
    lineHeight: 23,
    flexShrink: 1,
  },
  emptyPortfolioSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    flexShrink: 1,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioCard: {
    width: '48%',
    backgroundColor: '#161619',
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: '#232328',
    overflow: 'hidden',
  },
  portfolioImgWrap: {
    width: '100%',
    height: 130,
    position: 'relative',
    backgroundColor: '#0a0a0c',
  },
  portfolioImg: {
    width: '100%',
    height: '100%',
  },
  zoomBtnMini: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteObraBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: ds.alvo.compacto,
    height: ds.alvo.compacto,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: ds.alvo.compacto,
  },
  portfolioCardInfo: {
    padding: 8,
    gap: 4,
  },
  portfolioCardTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '700',
    lineHeight: 23,
    flexShrink: 1,
  },
  portfolioBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tagEstiloPill: {
    backgroundColor: '#202026',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagEstiloText: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  tagDisponivelPill: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagDisponivelText: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  tagCicatrizadaPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagCicatrizadaText: {
    color: '#10b981',
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  portfolioPreco: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemLabel: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.legenda,
    lineHeight: 17,
  },
  itemVal: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    flexShrink: 1,
    textAlign: 'right',
    lineHeight: 20,
  },
  itemValBold: {
    color: ds.cores.texto,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  itemValHighlight: {
    color: ds.cores.destaque,
    fontSize: ds.fonte.corpo,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
  },
  descText: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },

  // Estilos dos Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: ds.cores.superficie,
    borderRadius: ds.raio.modal,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    padding: 18,
    maxHeight: '85%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ds.cores.borda,
    paddingBottom: 12,
  },
  modalTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.modal,
    fontWeight: '800',
    lineHeight: 26,
    flexShrink: 1,
  },
  inputLabel: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'none',
    letterSpacing: 0,
    lineHeight: 17,
  },
  input: {
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    borderRadius: ds.raio.campo,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: ds.cores.texto,
    fontSize: ds.fonte.campo,
    lineHeight: 23,
    flexShrink: 1,
    minHeight: ds.alvo.controle,
  },
  btnEscolherGaleria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ds.cores.destaque,
    paddingVertical: 11,
    borderRadius: ds.raio.controle,
    minHeight: ds.alvo.controle,
  },
  btnEscolherGaleriaText: {
    color: '#000',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  orText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    textAlign: 'center',
    marginVertical: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
  previewContainer: {
    position: 'relative',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ds.cores.borda,
  },
  previewImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePreviewBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  estiloChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#1d1d23',
    borderWidth: 1,
    borderColor: ds.cores.borda,
  },
  estiloChipActive: {
    backgroundColor: ds.cores.destaque,
    borderColor: ds.cores.destaque,
  },
  estiloChipText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    fontWeight: '700',
    lineHeight: 20,
    flexShrink: 1,
  },
  estiloChipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ds.cores.elevada,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ds.cores.borda,
  },
  toggleLabel: {
    color: ds.cores.texto,
    fontSize: ds.fonte.legenda,
    fontWeight: '700',
    lineHeight: 17,
  },
  toggleSub: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  toggleBtn: {
    backgroundColor: '#26262e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ds.raio.controle,
    minHeight: ds.alvo.controle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#10b981',
  },
  toggleBtnText: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  toggleBtnTextActive: {
    color: '#000',
  },
  btnConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: ds.cores.destaque,
    paddingVertical: 12,
    borderRadius: ds.raio.controle,
    marginTop: 6,
    minHeight: ds.alvo.controle,
  },
  btnConfirmarText: {
    color: '#000',
    fontSize: ds.fonte.controle,
    fontWeight: '800',
    lineHeight: 20,
    flexShrink: 1,
    textAlign: 'center',
  },
  avatarPreviewModal: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: ds.cores.destaque,
  },
  avatarPreviewModalEmpty: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ds.cores.elevada,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImg: {
    width: '90%',
    height: '60%',
  },
  zoomCard: {
    backgroundColor: ds.cores.superficie,
    padding: 16,
    borderRadius: ds.raio.cartao,
    borderWidth: 1,
    borderColor: ds.cores.borda,
    width: '90%',
    marginTop: 14,
    gap: 4,
  },
  zoomCardTitle: {
    color: ds.cores.texto,
    fontSize: ds.fonte.subtitulo,
    fontWeight: '800',
    lineHeight: 23,
    flexShrink: 1,
  },
  zoomCardStyle: {
    color: ds.cores.textoSuave,
    fontSize: ds.fonte.corpo,
    lineHeight: 20,
    flexShrink: 1,
  },
  zoomCardPrice: {
    color: ds.cores.destaque,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    lineHeight: 20,
    flexShrink: 1,
  },
  zoomCardDesc: {
    color: ds.cores.textoSecundario,
    fontSize: ds.fonte.corpo,
    marginTop: 2,
    lineHeight: 20,
    flexShrink: 1,
  },
});
