# ContentFlow

> Aplicativo em desenvolvimento para transformar referências salvas em conteúdos planejados, produzidos e publicados.

**Tipo:** projeto pessoal · **Plataforma:** aplicativo mobile-first · **Status:** em desenvolvimento

## Problema e proposta

Profissionais e pequenos criadores frequentemente salvam ideias de conteúdo, mas perdem essas referências ou têm dificuldade para transformá-las em publicações. O ContentFlow busca organizar essa jornada em um único fluxo: **salvar uma inspiração → adaptar a ideia → preparar o roteiro → planejar → acompanhar a publicação**.

## Funcionalidades presentes no código

- **Conta e acesso:** cadastro, login e recuperação de senha com Supabase Auth, além de navegação protegida por sessão.
- **Inspirações:** registro, listagem e consulta de referências, com categorias, pesquisa e filtros.
- **Criação de conteúdo:** fluxo para iniciar uma ideia manualmente ou a partir de uma inspiração existente.
- **Roteiro:** edição de gancho, pontos principais e chamada para ação (CTA).
- **Planejamento:** visão semanal, escolha de datas, acompanhamento da meta e filtros por esforço de produção.
- **Acompanhamento:** organização das ideias em etapas como roteiro, gravação, edição, pronto e publicado.
- **Perfil e onboarding:** preferências e informações utilizadas para personalizar a experiência.
- **Persistência:** serviços de leitura e gravação de dados conectados ao Supabase.

Estas funcionalidades foram identificadas nos arquivos do projeto; o aplicativo ainda está em evolução e não é apresentado aqui como produto comercial finalizado.

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicativo | React Native, Expo e TypeScript |
| Navegação | Expo Router |
| Backend e autenticação | Supabase |
| Interface | Componentes React Native e ícones do Expo |

## Organização do código

- `src/app/`: rotas, telas e fluxos de navegação.
- `src/components/`: componentes compartilhados.
- `src/services/`: acesso e persistência de inspirações, conteúdos e perfil.
- `src/contexts/`: contexto de autenticação.
- `src/types/`: tipos das entidades da aplicação.
- `src/constants/`: configurações visuais e constantes.

## Executar localmente

### Pré-requisitos

- Node.js e npm compatíveis com a versão do Expo presente em `package.json`.
- Um projeto Supabase com autenticação e estrutura de dados compatíveis com os serviços do aplicativo.

1. Instale as dependências:

~~~bash
npm install
~~~

2. Configure as variáveis de ambiente em um arquivo `.env` local:

~~~dotenv
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
~~~

Utilize somente a chave publicável do Supabase. **Nunca inclua chaves de serviço ou segredos de administrador no aplicativo, no repositório ou em variáveis `EXPO_PUBLIC_*`.** A configuração do backend precisa corresponder às tabelas e políticas esperadas pelo código.

3. Inicie o projeto:

~~~bash
npx expo start
~~~

Para verificar o lint:

~~~bash
npm run lint
~~~

> **Observação:** a execução completa depende de um backend Supabase configurado. Instalar as dependências e preencher as variáveis não cria automaticamente as tabelas e políticas necessárias.

## Situação atual e próximos passos

Este é um projeto em desenvolvimento. Os fluxos, a experiência de uso e as integrações continuam sujeitos a ajustes e validação. A proposta é reduzir o caminho entre uma ideia salva e um conteúdo efetivamente publicado.

## Sobre o projeto

Projeto pessoal de desenvolvimento de software, com foco em organização de fluxos, experiência mobile e integração entre interface e persistência de dados.
