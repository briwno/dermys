interface AuthCadastro {
  signInWithPassword(credenciais: { email: string; password: string }): Promise<{
    data: { session: unknown | null }; error: unknown;
  }>;
}

/** Um usuário criado sem sessão não equivale a um login concluído. */
export async function autenticarAposCadastro(
  auth: AuthCadastro, sessao: unknown | null, email: string, password: string,
): Promise<boolean> {
  if (sessao) return true;
  // Permite entrar imediatamente quando a conta já foi confirmada pelo administrador
  // do ambiente de testes, mesmo que signUp não tenha devolvido uma sessão.
  const { data, error } = await auth.signInWithPassword({ email, password });
  return !error && Boolean(data.session);
}
