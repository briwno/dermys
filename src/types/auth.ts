export type TipoPerfil = 'cliente' | 'artista';
export type UserRole = TipoPerfil;

export interface PerfilUsuario {
  uid?: string;
  email: string;
  displayName?: string;
  role?: TipoPerfil;
  phoneNumber?: string;
  photoURL?: string;
  studioName?: string;
  studioAddress?: string;
  bio?: string;
  createdAt?: string;

  identificador?: string;
  nomeExibicao?: string;
  tipoPerfil?: TipoPerfil;
  telefone?: string;
  fotoUrl?: string;
  nomeEstudio?: string;
  enderecoEstudio?: string;
  biografia?: string;
  criadoEm?: string;
}

export interface UserProfile extends PerfilUsuario {}
