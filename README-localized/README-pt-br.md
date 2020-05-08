---
page_type: sample
products:
- ms-graph
languages:
- nodejs
- javascript
- html
extensions:
  contentType: samples
  technologies:
  - Microsoft Graph
  - Microsoft identity platform
  services:
  - Microsoft identity platform 
  - Security
  createdDate: 6/7/2018 1:14:00 PM
---
# Exemplo de Conexão do Microsoft Graph Security API para o Node. js

## Sumário

* [Introdução](#introduction)
* [Pré-requisitos](#prerequisites)
* [Registrar o aplicativo](#register-the-application)
* [Criar e executar o exemplo](#build-and-run-the-sample)
* [Perguntas e comentários](#questions-and-comments)
* [Colaboração](#contributing)
* [Recursos adicionais](#additional-resources)

## Introdução

Este exemplo mostra como conectar um aplicativo do Node.js a uma conta corporativa ou de estudante da Microsoft (Azure Active Directory) ou pessoal (Microsoft) usando a API do Microsoft Graph e o [SDK de JavaScript do Graph](https://github.com/microsoftgraph/msgraph-sdk-javascript) para recuperar Alertas de segurança e Atualizar um alerta.

![Captura de tela do Microsoft Graph Connect para node. js](readme-images/Webapp.PNG)

## Pré-requisitos

Para usar a amostra de conexão do Microsoft Graph para node.js, você precisará do seguinte:

* [node.js](https://nodejs.org/) versão > = 7.6.0.

* Uma [conta Microsoft](https://www.outlook.com/) ou uma [conta corporativa ou de estudante](http://dev.office.com/devprogram).

* [Ngrok](https://ngrok.com/download) de notificações do webhook.

## Registrar o aplicativo

Para configurar os exemplos, você precisará registrar um novo aplicativo no [Portal de Registro de Aplicativo Microsoft](https://go.microsoft.com/fwlink/?linkid=2083908).

Siga as etapas a seguir para registrar um novo aplicativo:

1. Entre no [Portal de Registro de Aplicativos do Azure](https://go.microsoft.com/fwlink/?linkid=2083908) usando sua conta pessoal ou uma conta corporativa ou de estudante.

2. Escolha **Novo registro**. Insira *http://localhost:3000/token* como o URI de redirecionamento.

3. Insira um nome para o aplicativo e selecione **Registrar**.
    > **Observação:** Se você quiser que seu aplicativo tenha vários locatários, selecione `Contas em qualquer diretório organizacional` na seção **Tipos de conta com suporte**.

4. Em seguida, você verá a página de visão geral do seu aplicativo. Copie e salve o **campo identificação do aplicativo**. Ele será necessário mais tarde para concluir o processo de configuração.

5. Em **Certificados & segredos**, escolha **Novo segredo do cliente** e adicione uma descrição rápida. Será exibido um novo segredo na coluna **Valor**. Copie essa senha. Ela será necessária mais tarde para concluir o processo de configuração.

6. Em **permissões de API**, escolha **Adicionar uma permissão** > **Microsoft Graph**.

7. Em **Permissões Delegadas**, adicione as permissões/escopos necessários à amostra. Este exemplo exige as permissões**User. Read. todos os**, **SecurityEvents. ReadWrite. All**e **SecurityActions. ReadWrite. All**.
    >**Observação**: Confira as [Referências de permissões do Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference) para saber mais sobre o modelo de permissão do gráfico.

## Conceda consentimento ao administrador para exibir dados de segurança

### Atribua o escopo (permissão)

1. Forneça ao seu administrador a **ID do aplicativo** e o **URI de redirecionamento** que você usou nas etapas anteriores. É necessário ter o administrador de locatários do Azure Active Directory da organização para conceder o consentimento necessário (permissões) para o aplicativo.
2. Como administrador de locatários para sua organização, abra uma janela do navegador e cole a seguinte URL na barra de endereços
(depois de adicionar valores para APPLICATION\_ID e REDIRECT\_URL): https://login.microsoftonline.com/common/adminconsent?client\_id=APPLICATION\_ID&state=12345&redirect\_uri=REDIRECT\_URL.
3. Após a autenticação, o administrador do locatário receberá uma caixa de diálogo como a seguinte (dependendo das permissões que o aplicativo estiver solicitando):

     ![Caixa de diálogo consentimento de escopo](readme-images/Scope.PNG)

3. Ao clicar em "aceitar" nesta caixa de diálogo, o administrador do locatário está concedendo consentimento a todos os usuários desta organização para usar esse aplicativo.
Observação: Como não há nenhum aplicativo sendo executado na URL de redirecionamento, você receberá uma mensagem de erro. Esse comportamento é esperado. O consentimento de um administrador de locatários será concedido pela hora em que esta página de erro é exibida.

    ![Caixa de diálogo consentimento de escopo](readme-images/GrantError.png)

### Autoriza os usuários em sua organização a acessar a API de segurança do Microsoft Graph (atribuir função necessária do Azure)

Para acessar os dados de segurança por meio da API de segurança do Microsoft Graph, o aplicativo do cliente deve receber as permissões necessárias e, ao operar no modo delegado, o usuário conectado ao aplicativo também deve estar autorizado a chamar a segurança do Microsoft Graph. APIs.</br>
Esta seção descreve como o administrador de locatários pode autorizar usuários específicos na organização.

1. Como um administrador de locatários, acesse o [Portal do Azure](https://portal.azure.com).

2. Navegue até a lâmina do Azure Active Directory.

3. Selecione **Usuários**.

4. Selecione uma conta de usuário que você deseja autorizar para acessar o Microsoft Graph Security API.

5. Selecione **Função de Diretório**.

6. Marque a caixa de seleção **Administrador Limitado** e marque a caixa de seleção ao lado da função **Administrador de segurança**

     ![Caixa de diálogo consentimento de função](readme-images/SecurityRole.png)

7. Clique no botão **Salvar** na parte superior da página

Repita essa ação para cada usuário na organização que tenha autorização para usar aplicativos que chamam a API de segurança do Microsoft Graph. Atualmente, não é possível conceder essa permissão a grupos de segurança.

> **Observação:** Para obter mais detalhes sobre o fluxo de autorização, leia [Autorização e API de segurança do Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization) 

## Configuração do webhook

1. Baixar [ngrok](https://ngrok.com/download).
2. Siga as instruções de instalação no site ngrok.
3. Execute o ngrok, se você estiver usando o Windows. Execute o "ngrok. exe http 3000" para iniciar a ngrok e abrir um túnel para a sua porta localhost 3000.
4. Em seguida, atualize o arquivo `config. js` com a URL do ngrok.

    ![Ngrok](readme-images/Ngrok.PNG)

## Criar e executar o exemplo

1. Baixe ou clone o Exemplo de Conexão com o Microsoft Graph para Node.js.

2. Usando seu IDE favorito, abra **configs.js**.

3. Substitua os valores **clientId** e **clientSecret** de espaço reservado com a ID do aplicativo e a senha que você copiou durante o registro do aplicativo. Substitua **notificationUrl** com a URL de encaminhamento do ngrok.

4. Em um prompt de comando, execute o seguinte comando no diretório raiz. Isso instala as dependências do projeto.

  ```instalação npm```

 > **Observação:**
 Pode ocorrer um erro durante esse processo se seu computador não tiver o Python 2.7 instalado. Se o erro ocorrer, o aplicativo Web ainda funcionará.

5. Execute o seguinte comando para iniciar o servidor de desenvolvimento.

  ```node app.js```

6. Navegue até `http://localhost:3000/` no navegador da Web.

7. Clique no botão **entrar com a Microsoft**.

8. Entre com sua conta pessoal, corporativa ou de estudante, e conceda as permissões solicitadas.

9. Selecione alertas para exibição definindo os critérios de filtragem e clique no botão **Obter alertas**. Quando a operação for concluída, os alertas correspondentes aos critérios de filtragem serão exibidos na página.
A consulta SDK e a consulta REST usadas para fazer a chamada também serão exibidas. A o clicar no link da consulta REST uma nova guia abrirá com o **Graph Explorer** preenchido previamente com a consulta.
    >**Observação:** O aplicativo está recuperando alertas de segurança de seu locatário que correspondem aos critérios de filtro. Se não houver nenhum alerta de segurança correspondente nos provedores listados, "nenhum alerta correspondente" será exibido na seção resposta. Para gerar alertas de amostra da Central de Segurança do Azure, confira [Validação de Alerta da Central de Segurança](https://docs.microsoft.com/en-us/azure/security-center/security-center-alert-validation)

10. Na lista de alertas correspondentes, clique no **Título** de um alerta específico que você deseja exibir. O protocolo JSON (detalhes de alerta concluído) será exibido na guia **Detalhes do Alerta**, no lado direito da página da Web. Se o alerta contiver o **nome da entidade de usuário ** ou **Propriedades de nome de domínio totalmente qualificado**, o aplicativo fará uma chamada adicional para o Azure Actove Directory por meio da API do Microsoft Graph para recuperar detalhes adicionais sobre a conta de usuário e o dispositivo. Clique em **Detalhes do dispositivo e do usuário** para exibir os dados do usuário e do dispositivo, caso existam.
11. Para atualizar um alerta, insira a ID do alerta, escolha/insira valores para as propriedades editáveis e clique no botão **Atualizar Alerta**. O **Detalhes do alerta original** e **Detalhes atualizados do alerta** serão exibidos na guia ** Gerenciamento de alerta** à direita da página da Web.
12. Para criar uma assinatura webhook, selecione pelo menos uma propriedade em qualquer lista suspensa ou insira um FQDN ou um UPN. Em seguida, clique em "Inscreva-se" para criar uma assinatura do webhook. Em seguida, clique em "Avisar" para abrir outra página que exibirá as notificações do webhook. Se um recurso de assinatura do webhook for atualizado, uma notificação será enviada para o aplicativo e exibida na página notificações.
    >**Observação:** Se você estiver executando o exemplo em sua máquina local, use [ngrok](#Webhook-setup) para criar e receber notificações corretamente.

## Perguntas e comentários

Gostaríamos de receber seus comentários sobre a amostra de conexão do Microsoft Graph Security API para node.js usando o SDK do JavaScript do Graph. Você pode enviar perguntas e sugestões na seção [Problemas](https://github.com/microsoftgraph/nodejs-connect-sample/issues) deste repositório.

As perguntas sobre o desenvolvimento do Microsoft Graph em geral devem ser postadas na [Microsoft TechCommunity](https://aka.ms/securitygraphcommunity)ou [Stack Overflow](http://stackoverflow.com/questions/tagged/microsoft-graph-security). Em **Stack Overflow** certifique-se de que suas dúvidas ou comentários estejam marcados com \[microsoft-graph-security].

## Colaboração ##

Esses exemplos são de open-source, liberados sob a [Licença MIT](https://github.com/microsoftgraph/nodejs-security-sample/blob/master/LICENSE). Dúvidas (incluindo solicitações de recursos e/ou perguntas sobre esse exemplo) e [solicitações pull](https://github.com/microsoftgraph/nodejs-security-sample/pulls) são bem-vindas. Também estamos interessados se houver outra amostra para a API de Segurança do Microsoft Graph que você gostaria de ver, conte mais a respeito nos comentários. Registre um [problema](https://github.com/microsoftgraph/nodejs-security-sample/issues) e fale conosco!

Este projeto adotou o [Código de Conduta de Código Aberto da Microsoft](https://opensource.microsoft.com/codeofconduct/).  Para saber mais, confira as [Perguntas frequentes sobre o Código de Conduta](https://opensource.microsoft.com/codeofconduct/faq/) ou entre em contato pelo [opencode@microsoft.com](mailto:opencode@microsoft.com) se tiver outras dúvidas ou comentários.
  
## Recursos adicionais

- [Documentação da API de segurança do Microsoft Graph](https://aka.ms/securitygraphdocs)
- [Autorização e API de segurança do Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)
- [Outros exemplos de conexão usando o Microsoft Graph](https://github.com/MicrosoftGraph?utf8=%E2%9C%93&query=-Connect)
- [Microsoft Graph](http://graph.microsoft.io)

## Direitos autorais
Copyright (c) 2018 Microsoft. Todos os direitos reservados.
