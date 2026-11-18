# Cardápio AR 🍽️📱

Cardápio web para restaurantes onde o cliente vê o prato em **3D** e, pelo celular, **em cima da própria mesa** (realidade aumentada) — sem instalar app.

- **Front:** React + Vite + [`<model-viewer>`](https://modelviewer.dev) (Google)
- **Banco e arquivos:** Supabase (projeto `cardapio-ar`, região São Paulo)
- **Hospedagem:** Netlify (já configurado em `netlify.toml`)

## Rotas
| Rota | O que é |
|---|---|
| `/` | Cardápio público (é o link do QR code da mesa) |
| `/admin/login` | Login do administrador |
| `/admin` | Painel protegido para cadastrar pratos, fotos e modelos 3D |

## Rodar no computador
```bash
npm install
npm run dev
```
Abra o endereço "Network" que aparece no terminal pelo celular (mesmo Wi-Fi) para testar. O AR de verdade precisa de **HTTPS**, então teste a câmera depois de publicar no Netlify.

## Criar o primeiro administrador
1. No Supabase: **Authentication → Users → Add user** (e-mail + senha, marque "Auto confirm").
2. No **SQL Editor**, rode:
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'seu@email.com';
   ```
3. Entre em `/admin/login` com esse e-mail e senha.
4. Recomendado: em **Authentication → Sign In / Providers → Email**, desative "Allow new users to sign up" (só você cria usuários).

## Como gerar o modelo 3D de um prato
1. Escaneie com um app de fotogrametria (Polycam, Luma AI, RealityScan ou Reality Composer no iPhone). Luz uniforme, sem reflexo, prato numa base giratória, 40–80 fotos ao redor.
2. Exporte em **.glb** (obrigatório) e, se possível, **.usdz** (melhor no iPhone; sem ele o model-viewer converte o .glb sozinho).
3. Deixe o arquivo leve: até ~5 MB. Dá para comprimir em https://gltf.report ou com `npx @gltf-transform/cli optimize prato.glb prato-otimizado.glb`.
4. Confira a **escala em metros** (um prato real tem ~0,27 m) — é ela que faz o prato aparecer no tamanho certo na mesa.
5. Envie pelo `/admin`.

## Segurança
- A chave `sb_publishable_...` é pública por natureza; a proteção vem das regras **RLS**:
  - qualquer pessoa só **lê** pratos ativos;
  - só usuários na tabela `admins` criam/editam/apagam pratos e arquivos.
- O painel valida a sessão no servidor (`getUser`), sai sozinho após 30 min parado, bloqueia o login por 5 min após 5 senhas erradas e não é indexado por buscadores.
- O código do admin é carregado à parte; o cliente do cardápio nunca o baixa.
- Uploads aceitam só imagens (até 5 MB) e .glb/.usdz (até 30 MB).
- Nunca coloque a chave `service_role`/secret no front.

## Estrutura
```
src/
  main.jsx                 rotas
  lib/supabase.js          cliente + upload de arquivos
  pages/Cardapio.jsx       cardápio público
  pages/Admin.jsx          login + cadastro de pratos
  components/Visualizador3D.jsx   3D + botão "Ver na minha mesa"
supabase/migrations/       esquema do banco (já aplicado)
```
