import { AppModal } from '@/components/ui/app-modal';
import { selecionarImagemGaleria } from '@/services/image-picker-helper';
import { PortfolioService } from '@/services/portfolio-service';
import { supabase } from '@/services/supabase';
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
      alert('Selecione ou insira uma imagem para a obra.');
      return;
    }
    if (!novoTitulo.trim()) {
      alert('Dê um título à obra (ex: Floral Botânico).');
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
      alert('Não foi possível salvar a obra. Tente novamente.');
    } finally {
      setSalvandoObra(false);
    }
  };

  // 3. AÇÃO: Remover obra do portfólio
  const handleRemoverObra = async (obraId: string) => {
    const confirmar = Platform.OS === 'web'
      ? window.confirm('Deseja realmente remover esta obra do seu portfólio?')
      : true;

    if (!confirmar) return;

    try {
      await PortfolioService.removerObra(obraId, artistaId);
      setObras((prev) => prev.filter((o) => o.id !== obraId));
      exibirAlerta('Obra removida do portfólio.');
    } catch {
      alert('Erro ao remover obra.');
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
      alert('Escolha ou insira a URL da foto de perfil.');
      return;
    }

    setSalvandoFoto(true);
    try {
      const fotoFinal = urlFotoTemporaria.trim();

      // Atualiza Supabase
      try {
        await supabase
          .from('profiles')
          .update({ foto_url: fotoFinal })
          .eq('id', artistaId);
      } catch {
        // silencioso
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
      alert('Erro ao atualizar foto de perfil.');
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

      try {
        await supabase
          .from('profiles')
          .update(payloadDb)
          .eq('id', artistaId);
      } catch {
        // silencioso
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
      alert('Erro ao salvar dados do perfil.');
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
              <Palette size={32} color={tc('#f3c21a')} />
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
          <Edit3 size={13} color={tc('#f3c21a')} />
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
              <ImageIcon size={18} color={tc('#f3c21a')} />
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
          <ActivityIndicator color={tc('#f3c21a')} style={{ marginVertical: 20 }} />
        ) : obras.length === 0 ? (
          <View style={styles.emptyPortfolioBox}>
            <ImageIcon size={28} color={tc('#6b7280')} />
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
                    <Maximize2 size={11} color={tc('#fff')} />
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
          <FileCheck2 size={16} color={tc('#f3c21a')} />
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
          <Building size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.nome_estudio || perfil.nomeEstudio || 'Estúdio Particular'}</Text>
        </View>

        <View style={styles.itemRow}>
          <MapPin size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.endereco_estudio || perfil.enderecoEstudio || 'Endereço não informado'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Phone size={14} color={tc('#6b7280')} />
          <Text style={styles.itemVal}>{perfil.telefone || '(11) 98888-8888'}</Text>
        </View>

        <View style={styles.itemRow}>
          <Mail size={14} color={tc('#6b7280')} />
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
                <Plus size={18} color={tc('#f3c21a')} />
                <Text style={styles.modalTitle}>Adicionar Foto ao Portfólio</Text>
              </View>
              <Pressable onPress={() => setModalNovaObraAberto(false)}>
                <X size={20} color={tc('#fff')} />
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
                      <X size={14} color={tc('#fff')} />
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
                      placeholderTextColor={tc('#6b7280')}
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
                  placeholderTextColor={tc('#6b7280')}
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
                  placeholderTextColor={tc('#6b7280')}
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
                  placeholderTextColor={tc('#6b7280')}
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
                <Camera size={18} color={tc('#f3c21a')} />
                <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>
              </View>
              <Pressable onPress={() => setModalFotoAberto(false)}>
                <X size={20} color={tc('#fff')} />
              </Pressable>
            </View>

            <View style={{ gap: 14 }}>
              {/* Preview */}
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                {urlFotoTemporaria ? (
                  <Image source={{ uri: urlFotoTemporaria }} style={styles.avatarPreviewModal} />
                ) : (
                  <View style={styles.avatarPreviewModalEmpty}>
                    <Camera size={36} color={tc('#6b7280')} />
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
                placeholderTextColor={tc('#6b7280')}
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
                <Edit3 size={18} color={tc('#f3c21a')} />
                <Text style={styles.modalTitle}>Editar Dados do Estúdio</Text>
              </View>
              <Pressable onPress={() => setModalDadosAberto(false)}>
                <X size={20} color={tc('#fff')} />
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
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Nome do Estúdio *</Text>
                <TextInput
                  style={styles.input}
                  value={formEstudio}
                  onChangeText={setFormEstudio}
                  placeholder="Nome do estúdio ou 'Estúdio Particular'"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Endereço do Estúdio</Text>
                <TextInput
                  style={styles.input}
                  value={formEndereco}
                  onChangeText={setFormEndereco}
                  placeholder="Rua, número, bairro"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Cidade / Região (Feed Regional) *</Text>
                <TextInput
                  style={styles.input}
                  value={formCidade}
                  onChangeText={setFormCidade}
                  placeholder="São Paulo, SP"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Telefone / WhatsApp</Text>
                <TextInput
                  style={styles.input}
                  value={formTelefone}
                  onChangeText={setFormTelefone}
                  placeholder="(11) 99999-9999"
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Estilo Principal de Tatuagem</Text>
                <TextInput
                  style={styles.input}
                  value={formEstilo}
                  onChangeText={setFormEstilo}
                  placeholder="Fine Line, Blackwork..."
                  placeholderTextColor={tc('#6b7280')}
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
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Chave PIX (Mercado Pago / Recebimento)</Text>
                <TextInput
                  style={styles.input}
                  value={formPix}
                  onChangeText={setFormPix}
                  placeholder="chave@pix.com.br"
                  placeholderTextColor={tc('#6b7280')}
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
                  placeholderTextColor={tc('#6b7280')}
                />
              </View>

              <View>
                <Text style={styles.inputLabel}>Biografia & Especialidades</Text>
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  value={formBio}
                  onChangeText={setFormBio}
                  placeholder="Fale sobre sua experiência, técnicas..."
                  placeholderTextColor={tc('#6b7280')}
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
              <X size={20} color={tc('#fff')} />
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
    gap: 14,
  },
  feedbackToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  feedbackToastText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  profileHeader: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
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
    borderColor: '#f3c21a',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#171717',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#f3c21a',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#101010',
  },
  name: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '800',
  },
  studio: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 10,
    fontWeight: '700',
  },
  btnEditarPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1c1c1f',
    borderWidth: 1,
    borderColor: '#2e2e33',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  btnEditarPerfilText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#101010',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1d1d1d',
    padding: 16,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  portfolioHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  portfolioSubtitle: {
    color: '#8e8e93',
    fontSize: 11,
    marginTop: 2,
  },
  btnAddObra: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f3c21a',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  btnAddObraText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
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
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyPortfolioSub: {
    color: '#71717a',
    fontSize: 11,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioCard: {
    width: '48%',
    backgroundColor: '#161619',
    borderRadius: 12,
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
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portfolioCardInfo: {
    padding: 8,
    gap: 4,
  },
  portfolioCardTitle: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
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
    color: '#d1d5db',
    fontSize: 9,
    fontWeight: '700',
  },
  tagDisponivelPill: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagDisponivelText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '800',
  },
  tagCicatrizadaPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagCicatrizadaText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
  },
  portfolioPreco: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  itemLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  itemVal: {
    color: '#fff',
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  itemValBold: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  itemValHighlight: {
    color: '#f3c21a',
    fontSize: 12,
    fontWeight: '800',
  },
  descText: {
    color: '#d1d5db',
    fontSize: 12.5,
    lineHeight: 18,
  },

  // Estilos dos Modais
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#121215',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#26262c',
    padding: 18,
    maxHeight: '85%',
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#202026',
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#d1d5db',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#1b1b20',
    borderWidth: 1,
    borderColor: '#2c2c34',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#fff',
    fontSize: 13,
  },
  btnEscolherGaleria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 11,
    borderRadius: 10,
  },
  btnEscolherGaleriaText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  orText: {
    color: '#8e8e93',
    fontSize: 10.5,
    textAlign: 'center',
    marginVertical: 2,
  },
  previewContainer: {
    position: 'relative',
    height: 150,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3a3a44',
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
    borderColor: '#2d2d36',
  },
  estiloChipActive: {
    backgroundColor: '#f3c21a',
    borderColor: '#f3c21a',
  },
  estiloChipText: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '700',
  },
  estiloChipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#18181d',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26262e',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  toggleSub: {
    color: '#71717a',
    fontSize: 10,
  },
  toggleBtn: {
    backgroundColor: '#26262e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleBtnActive: {
    backgroundColor: '#10b981',
  },
  toggleBtnText: {
    color: '#8e8e93',
    fontSize: 10,
    fontWeight: '800',
  },
  toggleBtnTextActive: {
    color: '#000',
  },
  btnConfirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 6,
  },
  btnConfirmarText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  avatarPreviewModal: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#f3c21a',
  },
  avatarPreviewModalEmpty: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1b1b20',
    borderWidth: 1,
    borderColor: '#2d2d36',
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
    backgroundColor: '#121215',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26262c',
    width: '90%',
    marginTop: 14,
    gap: 4,
  },
  zoomCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  zoomCardStyle: {
    color: '#9ca3af',
    fontSize: 11,
  },
  zoomCardPrice: {
    color: '#f3c21a',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  zoomCardDesc: {
    color: '#d1d5db',
    fontSize: 11,
    marginTop: 2,
  },
});
