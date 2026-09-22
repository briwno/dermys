import React, { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coffee,
  Flame,
  Heart,
  Image as ImageIcon,
  MapPin,
  Maximize2,
  MessageSquare,
  Navigation,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Wifi,
  Wind,
  X,
  Zap,
} from 'lucide-react-native';
import { AppModal } from '@/components/ui/app-modal';
import { LocalidadeService } from '@/services/localidade-service';
import type { ItemPortfolio, PerfilArtistaCompleto, ReviewArtista } from '@/types/artista-detalhado';

interface ModalPerfilArtistaProps {
  visivel: boolean;
  perfil: PerfilArtistaCompleto | null;
  flashInicial?: ItemPortfolio | null;
  onClose: () => void;
  onIniciarAgendamento: (artista: PerfilArtistaCompleto, flash?: ItemPortfolio) => void;
  onAbrirChat?: (artista: PerfilArtistaCompleto) => void;
}

type AbaPerfil = 'portfolio' | 'flashes' | 'reviews' | 'estudio';

export function ModalPerfilArtista({
  visivel,
  perfil,
  flashInicial,
  onClose,
  onIniciarAgendamento,
  onAbrirChat,
}: ModalPerfilArtistaProps) {
  const [abaAtiva, setAbaAtiva] = useState<AbaPerfil>('portfolio');
  const [curtido, setCurtido] = useState(false);
  const [flashSelecionado, setFlashSelecionado] = useState<ItemPortfolio | null>(flashInicial || null);
  const [fotoZoom, setFotoZoom] = useState<ItemPortfolio | null>(null);

  if (!perfil) return null;

  const totalCurtidas = perfil.curtidas + (curtido ? 1 : 0);

  return (
    <AppModal visible={visivel} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header com Imagem de Capa e Botão Fechar */}
          <View style={styles.heroWrap}>
            <Image
              source={{
                uri:
                  perfil.capaUrl ||
                  perfil.fotoUrl ||
                  'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80',
              }}
              style={styles.heroCoverImage}
            />
            <View style={styles.heroGradient} />

            {/* Ações Superiores na Capa */}
            <View style={styles.topActionsBar}>
              <Pressable style={styles.circleBtn} onPress={onClose}>
                <X size={18} color="#fff" />
              </Pressable>

              <View style={styles.topActionsRight}>
                <Pressable
                  style={[styles.circleBtn, curtido && styles.circleBtnActive]}
                  onPress={() => setCurtido((c) => !c)}
                >
                  <Heart
                    size={16}
                    color={curtido ? '#f43f5e' : '#fff'}
                    fill={curtido ? '#f43f5e' : 'transparent'}
                  />
                </Pressable>
              </View>
            </View>

            {/* Informações do Artista Sobrepostas no Hero */}
            <View style={styles.artistHeroInfo}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{
                    uri:
                      perfil.fotoUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                  }}
                  style={styles.avatarImage}
                />
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#000" />
                </View>
              </View>

              <View style={styles.artistNameBlock}>
                <View style={styles.nameRow}>
                  <Text style={styles.artistNameText}>{perfil.nomeArtista}</Text>
                  <View style={styles.proTag}>
                    <Text style={styles.proTagText}>DERMYS PRO</Text>
                  </View>
                </View>

                <Text style={styles.studioNameText}>{perfil.nomeEstudio}</Text>

                <View style={styles.metaPillsRow}>
                  {perfil.distanciaFormatada ? (
                    <View style={styles.distanceBadgePill}>
                      <MapPin size={10} color="#000" />
                      <Text style={styles.distanceBadgeText}>{perfil.distanciaFormatada}</Text>
                    </View>
                  ) : null}

                  <View style={styles.locationPill}>
                    <MapPin size={11} color="#9ca3af" />
                    <Text style={styles.locationText}>{perfil.cidade}</Text>
                  </View>

                  <View style={styles.ratingPill}>
                    <Star size={11} color="#f3c21a" fill="#f3c21a" />
                    <Text style={styles.ratingText}>
                      {perfil.notaMedia.toFixed(1)} ({perfil.totalAvaliacoes})
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.agendaBadgePill,
                      perfil.agendaAberta !== false
                        ? styles.agendaBadgeAberta
                        : styles.agendaBadgeFechada,
                    ]}
                  >
                    <View
                      style={[
                        styles.agendaBadgeDot,
                        perfil.agendaAberta !== false
                          ? styles.dotGreenMini
                          : styles.dotAmberMini,
                      ]}
                    />
                    <Text
                      style={[
                        styles.agendaBadgeText,
                        perfil.agendaAberta !== false
                          ? styles.agendaTextAberta
                          : styles.agendaTextFechada,
                      ]}
                    >
                      {perfil.agendaAberta !== false ? 'Agenda Aberta' : 'Agenda Fechada'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Conteúdo com Scroll */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Aviso de Agenda Fechada se aplicável */}
            {perfil.agendaAberta === false && (
              <View style={styles.agendaFechadaCallout}>
                <Clock size={16} color="#f59e0b" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.agendaFechadaCalloutTitle}>Agenda Temporariamente Fechada</Text>
                  <Text style={styles.agendaFechadaCalloutSub}>
                    {perfil.mensagemAgendaFechada ||
                      'O artista está pausado para novas datas, mas você pode enviar seu briefing para a lista de espera!'}
                  </Text>
                </View>
              </View>
            )}

            {/* Bloco de Média de Preços & Valores Transparentes */}
            <View style={styles.pricingSection}>
              <View style={styles.priceCard}>
                <Text style={styles.priceCardLabel}>A PARTIR DE</Text>
                <Text style={styles.priceCardValue}>R$ {perfil.precoInicial}</Text>
                <Text style={styles.priceCardSub}>Peças autorais</Text>
              </View>

              <View style={styles.priceCard}>
                <Text style={styles.priceCardLabel}>MÉDIA / HORA</Text>
                <Text style={styles.priceCardValue}>R$ {perfil.precoMedioHora || 250}</Text>
                <Text style={styles.priceCardSub}>Sessões longas</Text>
              </View>

              <View style={styles.priceCard}>
                <Text style={styles.priceCardLabel}>SINAL M. PAGO</Text>
                <Text style={[styles.priceCardValue, { color: '#10b981' }]}>
                  R$ {perfil.valorSinalBase || 120}
                </Text>
                <Text style={styles.priceCardSub}>Reserva garantida</Text>
              </View>
            </View>

            {/* Bio & Especialidades */}
            <View style={styles.bioCard}>
              <Text style={styles.sectionHeading}>Sobre o Artista</Text>
              <Text style={styles.bioText}>{perfil.biografia}</Text>

              {/* Tags de Estilos de Atuação */}
              <View style={styles.stylesTagsRow}>
                <View style={[styles.stylePill, styles.stylePillPrimary]}>
                  <Sparkles size={12} color="#f3c21a" />
                  <Text style={styles.stylePillPrimaryText}>{perfil.estilo}</Text>
                </View>
                {perfil.estilosSecundarios?.map((st, idx) => (
                  <View key={idx} style={styles.stylePill}>
                    <Text style={styles.stylePillText}>{st}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Navegador de Abas do Perfil */}
            <View style={styles.tabsNavContainer}>
              <Pressable
                style={[styles.tabNavItem, abaAtiva === 'portfolio' && styles.tabNavItemActive]}
                onPress={() => setAbaAtiva('portfolio')}
              >
                <ImageIcon size={14} color={abaAtiva === 'portfolio' ? '#f3c21a' : '#888'} />
                <Text style={[styles.tabNavText, abaAtiva === 'portfolio' && styles.tabNavTextActive]}>
                  Portfólio ({perfil.portfolio.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabNavItem, abaAtiva === 'flashes' && styles.tabNavItemActive]}
                onPress={() => setAbaAtiva('flashes')}
              >
                <Flame size={14} color={abaAtiva === 'flashes' ? '#f3c21a' : '#888'} />
                <Text style={[styles.tabNavText, abaAtiva === 'flashes' && styles.tabNavTextActive]}>
                  Flashes ({perfil.flashes.length})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabNavItem, abaAtiva === 'reviews' && styles.tabNavItemActive]}
                onPress={() => setAbaAtiva('reviews')}
              >
                <Star size={14} color={abaAtiva === 'reviews' ? '#f3c21a' : '#888'} />
                <Text style={[styles.tabNavText, abaAtiva === 'reviews' && styles.tabNavTextActive]}>
                  Reviews ({perfil.totalAvaliacoes})
                </Text>
              </Pressable>

              <Pressable
                style={[styles.tabNavItem, abaAtiva === 'estudio' && styles.tabNavItemActive]}
                onPress={() => setAbaAtiva('estudio')}
              >
                <ShieldCheck size={14} color={abaAtiva === 'estudio' ? '#f3c21a' : '#888'} />
                <Text style={[styles.tabNavText, abaAtiva === 'estudio' && styles.tabNavTextActive]}>
                  Estúdio
                </Text>
              </Pressable>
            </View>

            {/* ABA 1: PORTFÓLIO */}
            {abaAtiva === 'portfolio' && (
              <View style={styles.tabContentArea}>
                <View style={styles.portfolioGrid}>
                  {perfil.portfolio.map((item, idx) => (
                    <Pressable
                      key={item.id || idx}
                      style={styles.portfolioCard}
                      onPress={() => setFotoZoom(item)}
                    >
                      <Image source={{ uri: item.imagemUrl }} style={styles.portfolioImage} />
                      <View style={styles.portfolioTagOverlay}>
                        <Text style={styles.portfolioTagText}>{item.estilo}</Text>
                      </View>
                      <View style={styles.zoomIconWrap}>
                        <Maximize2 size={12} color="#fff" />
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* ABA 2: FLASHES AUTORAIS */}
            {abaAtiva === 'flashes' && (
              <View style={styles.tabContentArea}>
                <View style={styles.flashesGrid}>
                  {perfil.flashes.map((flash, idx) => (
                    <View key={flash.id || idx} style={styles.flashCardItem}>
                      <Image source={{ uri: flash.imagemUrl }} style={styles.flashCardImage} />
                      <View style={styles.flashCardContent}>
                        <View style={styles.flashTitleRow}>
                          <Text style={styles.flashTitleText} numberOfLines={1}>
                            {flash.titulo}
                          </Text>
                          <Text style={styles.flashPriceText}>R$ {flash.preco?.toFixed(2)}</Text>
                        </View>
                        <Text style={styles.flashStyleText}>{flash.estilo}</Text>

                        <Pressable
                          style={styles.btnSelectFlash}
                          onPress={() => {
                            setFlashSelecionado(flash);
                            onIniciarAgendamento(perfil, flash);
                          }}
                        >
                          <Calendar size={13} color="#111" />
                          <Text style={styles.btnSelectFlashText}>Reservar Este Flash</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ABA 3: AVALIAÇÕES & REVIEWS */}
            {abaAtiva === 'reviews' && (
              <View style={styles.tabContentArea}>
                {/* Score Geral */}
                <View style={styles.reviewsScoreCard}>
                  <View style={styles.scoreLeft}>
                    <Text style={styles.scoreLargeNumber}>{perfil.notaMedia.toFixed(1)}</Text>
                    <View style={styles.starsRow}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={14} color="#f3c21a" fill="#f3c21a" />
                      ))}
                    </View>
                    <Text style={styles.scoreSubText}>Baseado em {perfil.totalAvaliacoes} sessões</Text>
                  </View>

                  <View style={styles.scoreRight}>
                    <View style={styles.badgeHighlight}>
                      <ShieldCheck size={14} color="#10b981" />
                      <Text style={styles.badgeHighlightText}>100% Clientes Verificados</Text>
                    </View>
                    <View style={styles.badgeHighlight}>
                      <Sparkles size={14} color="#f3c21a" />
                      <Text style={styles.badgeHighlightText}>Alta taxa de retorno</Text>
                    </View>
                  </View>
                </View>

                {/* Lista de Comentários */}
                <View style={styles.reviewsList}>
                  {perfil.reviews.length === 0 ? (
                    <View style={styles.emptyReviewsCard}>
                      <Sparkles size={20} color="#f3c21a" />
                      <Text style={styles.emptyReviewsTitle}>Ainda sem avaliações registradas</Text>
                      <Text style={styles.emptyReviewsSub}>
                        Seja o primeiro cliente a agendar e deixar seu depoimento!
                      </Text>
                    </View>
                  ) : (
                    perfil.reviews.map((rev) => (
                      <View key={rev.id} style={styles.reviewCard}>
                        <View style={styles.reviewHeader}>
                          <View style={styles.reviewAuthorWrap}>
                            {rev.autorAvatar ? (
                              <Image source={{ uri: rev.autorAvatar }} style={styles.reviewAvatar} />
                            ) : (
                              <View style={styles.reviewAvatarPlaceholder}>
                                <Text style={styles.avatarInitial}>{rev.autorNome[0]}</Text>
                              </View>
                            )}
                            <View>
                              <View style={styles.authorVerifiedRow}>
                                <Text style={styles.authorName}>{rev.autorNome}</Text>
                                {rev.verificado && <CheckCircle2 size={12} color="#10b981" />}
                              </View>
                              <Text style={styles.reviewMetaDate}>
                                {rev.data} • {rev.estiloTatuado}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.reviewRatingBadge}>
                            <Star size={11} color="#f3c21a" fill="#f3c21a" />
                            <Text style={styles.reviewRatingNum}>{rev.nota}.0</Text>
                          </View>
                        </View>

                        <Text style={styles.reviewComment}>{rev.comentario}</Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}

            {/* ABA 4: ESTÚDIO & BIOSSEGURANÇA */}
            {abaAtiva === 'estudio' && (
              <View style={styles.tabContentArea}>
                {/* Localização & Horário */}
                <View style={styles.studioInfoCard}>
                  <Text style={styles.sectionHeading}>Localização & Funcionamento</Text>

                  <View style={styles.infoRow}>
                    <MapPin size={16} color="#f3c21a" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoTitle}>{perfil.estudioInfo.nome}</Text>
                      <Text style={styles.infoSubtitle}>
                        {perfil.estudioInfo.endereco} — {perfil.estudioInfo.bairroCidade}
                      </Text>
                      {perfil.distanciaFormatada ? (
                        <Text style={styles.infoDistanceSub}>
                          📍 Aprox. {perfil.distanciaFormatada} de distância da sua localização
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Pressable
                    style={styles.mapRouteBtn}
                    onPress={() =>
                      LocalidadeService.abrirRotaNoMapa(
                        perfil.latitude,
                        perfil.longitude,
                        `${perfil.nomeEstudio}, ${perfil.enderecoEstudio || perfil.cidade}`
                      )
                    }
                  >
                    <Navigation size={13} color="#000" />
                    <Text style={styles.mapRouteBtnText}>Traçar Rota no Google Maps / Waze</Text>
                  </Pressable>

                  <View style={[styles.infoRow, { marginTop: 4 }]}>
                    <Clock size={16} color="#f3c21a" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.infoTitle}>Horário de Atendimento</Text>
                      <Text style={styles.infoSubtitle}>
                        {perfil.estudioInfo.horarioFuncionamento}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Comodidades do Estúdio */}
                <View style={styles.studioInfoCard}>
                  <Text style={styles.sectionHeading}>Comodidades do Espaço</Text>
                  <View style={styles.amenitiesGrid}>
                    {perfil.estudioInfo.comodidades.map((c, i) => (
                      <View key={i} style={styles.amenityItem}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <Text style={styles.amenityText}>{c}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Protocolos de Biossegurança */}
                <View style={[styles.studioInfoCard, styles.bioSafeCard]}>
                  <View style={styles.bioSafeHeader}>
                    <ShieldCheck size={18} color="#10b981" />
                    <Text style={styles.bioSafeTitle}>Protocolo de Biossegurança Dermys</Text>
                  </View>
                  <View style={styles.amenitiesGrid}>
                    {perfil.estudioInfo.protocolosBiosseguranca.map((p, i) => (
                      <View key={i} style={styles.amenityItem}>
                        <CheckCircle2 size={14} color="#10b981" />
                        <Text style={styles.bioSafeText}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Barra de Ações Fixa no Rodapé */}
          <View style={styles.footerActionsBar}>
            {onAbrirChat && (
              <Pressable
                style={styles.btnChatAction}
                onPress={() => {
                  onClose();
                  onAbrirChat(perfil);
                }}
              >
                <MessageSquare size={18} color="#fff" />
                <Text style={styles.btnChatActionText}>Chat</Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.btnBookAction,
                perfil.agendaAberta === false && styles.btnBookActionWaitlist,
              ]}
              onPress={() => onIniciarAgendamento(perfil, flashSelecionado || undefined)}
            >
              <Calendar size={18} color={perfil.agendaAberta === false ? '#f59e0b' : '#111'} />
              <Text
                style={[
                  styles.btnBookActionText,
                  perfil.agendaAberta === false && styles.btnBookActionTextWaitlist,
                ]}
              >
                {flashSelecionado
                  ? 'Reservar Flash Selecionado'
                  : perfil.agendaAberta === false
                  ? 'Enviar Briefing (Lista de Espera)'
                  : 'Pedir Orçamento / Agendar'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Modal de Zoom da Obra do Portfólio */}
        {fotoZoom && (
          <View style={styles.zoomOverlay}>
            <Pressable style={styles.zoomCloseBtn} onPress={() => setFotoZoom(null)}>
              <X size={20} color="#fff" />
            </Pressable>
            <Image source={{ uri: fotoZoom.imagemUrl }} style={styles.zoomFullImage} resizeMode="contain" />
            <View style={styles.zoomDetailsCard}>
              <Text style={styles.zoomTitle}>{fotoZoom.titulo}</Text>
              <Text style={styles.zoomStyle}>{fotoZoom.estilo} • Trabalho cicatrizado</Text>
              {fotoZoom.preco && (
                <Text style={styles.zoomPrice}>A partir de R$ {fotoZoom.preco.toFixed(2)}</Text>
              )}
            </View>
          </View>
        )}
      </View>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '94%',
    backgroundColor: '#0a0a0c',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    position: 'relative',
  },
  heroWrap: {
    height: 190,
    width: '100%',
    position: 'relative',
    backgroundColor: '#121214',
  },
  heroCoverImage: {
    width: '100%',
    height: '100%',
    opacity: 0.55,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 10, 12, 0.45)',
  },
  topActionsBar: {
    position: 'absolute',
    top: 14,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topActionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnActive: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderColor: '#f43f5e',
  },
  artistHeroInfo: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#f3c21a',
    position: 'relative',
    backgroundColor: '#161618',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0c',
  },
  artistNameBlock: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  artistNameText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  proTag: {
    backgroundColor: 'rgba(243, 194, 26, 0.15)',
    borderWidth: 1,
    borderColor: '#f3c21a',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proTagText: {
    color: '#f3c21a',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  studioNameText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '600',
  },
  metaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  distanceBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f3c21a',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161618',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#26262a',
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  agendaBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  agendaBadgeAberta: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  agendaBadgeFechada: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  agendaBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreenMini: {
    backgroundColor: '#10b981',
  },
  dotAmberMini: {
    backgroundColor: '#f59e0b',
  },
  agendaBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  agendaTextAberta: {
    color: '#10b981',
  },
  agendaTextFechada: {
    color: '#f59e0b',
  },
  agendaFechadaCallout: {
    backgroundColor: '#1c170a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#543f07',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  agendaFechadaCalloutTitle: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
  },
  agendaFechadaCalloutSub: {
    color: '#bbb',
    fontSize: 10,
    marginTop: 1,
    lineHeight: 15,
  },
  btnBookActionWaitlist: {
    backgroundColor: '#1c170a',
    borderWidth: 1,
    borderColor: '#543f07',
  },
  btnBookActionTextWaitlist: {
    color: '#f59e0b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  pricingSection: {
    flexDirection: 'row',
    gap: 8,
  },
  priceCard: {
    flex: 1,
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  priceCardLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  priceCardValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    marginVertical: 2,
  },
  priceCardSub: {
    color: '#a1a1aa',
    fontSize: 10,
  },
  bioCard: {
    backgroundColor: '#121216',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222228',
    padding: 14,
    gap: 8,
  },
  sectionHeading: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  bioText: {
    color: '#d4d4d8',
    fontSize: 12,
    lineHeight: 18,
  },
  stylesTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  stylePill: {
    backgroundColor: '#1c1c24',
    borderWidth: 1,
    borderColor: '#2e2e38',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stylePillPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(243, 194, 26, 0.12)',
    borderColor: 'rgba(243, 194, 26, 0.4)',
  },
  stylePillPrimaryText: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '800',
  },
  stylePillText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  tabsNavContainer: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#222228',
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabNavItemActive: {
    backgroundColor: '#202028',
  },
  tabNavText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '700',
  },
  tabNavTextActive: {
    color: '#ffffff',
  },
  tabContentArea: {
    marginTop: 4,
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  portfolioCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1a1a20',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
  },
  portfolioTagOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  portfolioTagText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  zoomIconWrap: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashesGrid: {
    gap: 10,
  },
  flashCardItem: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 14,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
  },
  flashCardImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#1a1a20',
  },
  flashCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  flashTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flashTitleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginRight: 6,
  },
  flashPriceText: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '900',
  },
  flashStyleText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  btnSelectFlash: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  btnSelectFlashText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
  },
  reviewsScoreCard: {
    flexDirection: 'row',
    backgroundColor: '#121216',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222228',
    padding: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreLeft: {
    alignItems: 'center',
    gap: 2,
  },
  scoreLargeNumber: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  scoreSubText: {
    color: '#71717a',
    fontSize: 10,
    marginTop: 2,
  },
  scoreRight: {
    gap: 6,
  },
  badgeHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#181820',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  badgeHighlightText: {
    color: '#e4e4e7',
    fontSize: 10,
    fontWeight: '700',
  },
  reviewsList: {
    gap: 10,
  },
  reviewCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#262630',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  authorVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reviewMetaDate: {
    color: '#71717a',
    fontSize: 10,
  },
  reviewRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#1c1c24',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  reviewRatingNum: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  reviewComment: {
    color: '#d4d4d8',
    fontSize: 11,
    lineHeight: 16,
  },
  emptyReviewsCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyReviewsTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyReviewsSub: {
    color: '#888892',
    fontSize: 11,
    textAlign: 'center',
  },
  studioInfoCard: {
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  infoSubtitle: {
    color: '#9ca3af',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  infoDistanceSub: {
    color: '#f3c21a',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  mapRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f3c21a',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginVertical: 4,
  },
  mapRouteBtnText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: '900',
  },
  amenitiesGrid: {
    gap: 6,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amenityText: {
    color: '#e4e4e7',
    fontSize: 11,
    fontWeight: '600',
  },
  bioSafeCard: {
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  bioSafeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bioSafeTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
  },
  bioSafeText: {
    color: '#d1d5db',
    fontSize: 11,
  },
  footerActionsBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0d0d10',
    borderTopWidth: 1,
    borderTopColor: '#1c1c22',
    gap: 10,
    alignItems: 'center',
  },
  btnChatAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#181820',
    borderWidth: 1,
    borderColor: '#282834',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnChatActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnBookAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3c21a',
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnBookActionText: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  zoomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  zoomCloseBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a20',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  zoomFullImage: {
    width: '100%',
    height: '65%',
    borderRadius: 14,
  },
  zoomDetailsCard: {
    width: '100%',
    backgroundColor: '#121216',
    borderWidth: 1,
    borderColor: '#222228',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  zoomTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  zoomStyle: {
    color: '#9ca3af',
    fontSize: 11,
  },
  zoomPrice: {
    color: '#f3c21a',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
});
