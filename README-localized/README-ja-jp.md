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
\# Node.js 用 Microsoft Graph Security API 接続サンプル

## 目次

* [はじめに](#introduction)
* [前提条件](#prerequisites)
* [アプリケーションの登録](#register-the-application)
* [サンプルのビルドと実行](#build-and-run-the-sample)
* [質問とコメント](#questions-and-comments)
* [投稿](#contributing)
* [その他のリソース](#additional-resources)

## 概要

このサンプルは、セキュリティ通知を取得し、通知を更新するために Microsoft Graph API と [Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) を使用し、Microsoft の職場または学校 (Azure Active Directory) アカウント、あるいは個人用 (Microsoft) アカウントに Node.js アプリを接続する方法を示します。

![Node.js 用 Microsoft Graph 接続サンプルのスクリーンショット](readme-images/Webapp.PNG)

## 前提条件

Node.js 用 Microsoft Graph 接続サンプルを使用するには、以下が必要です。

* [Node.js](https://nodejs.org/) (バージョン 7.6.0 以上)。

* [Microsoft アカウント](https://www.outlook.com/)か[職場または学校のアカウント](http://dev.office.com/devprogram)

* Webhook 通知用の [Ngrok](https://ngrok.com/download)。

## アプリケーションの登録

サンプルを構成するには、Microsoft [アプリケーション登録ポータル](https://go.microsoft.com/fwlink/?linkid=2083908)に新しいアプリケーションを登録する必要があります。

新しいアプリケーションを登録するためのこれらの手順に従います。

1. 個人用アカウントか、職場または学校アカウントのいずれかを使用して、[Azure アプリ登録ポータル](https://go.microsoft.com/fwlink/?linkid=2083908)にサインインします。

2. [**新規登録**] を選択します。リダイレクト URI には、*http://localhost:3000/token* と入力します。

3. アプリの名前を入力して、[**登録**] を選択します。
    > **注:**アプリケーションをマルチテナントにしたい場合は、[**サポートされているアカウントの種類**] セクションで、[`任意の組織のディレクトリ内のアカウント`] を選択します。

4. 次に、アプリの [概要] ページが表示されます。[**アプリケーション ID**] フィールドをコピーして保存します。構成プロセスを完了するために、後で必要になります。

5. [**証明書とシークレット**] の下で、[**新しいクライアント シークレット**] を選択し、簡単な説明を追加します。[**値**] 列に新しいシークレットが表示されます。このパスワードをコピーします。構成プロセスを完了するために、後で必要になります。

6. [**API のアクセス許可**] の下で、[**アクセス許可の追加**]、[**Microsoft Graph**] の順に選択します。

7. [**委任されたアクセス許可**] の下で、サンプルに必要なアクセス許可と範囲を追加します。このサンプルには、**User.Read.All**、**SecurityEvents.ReadWrite.All**、および**SecurityActions.ReadWrite.All** アクセス許可が必要です。
    >**注**: Graph のアクセス許可モデルの詳細については、「[Microsoft Graph のアクセス許可のリファレンス](https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference)」を参照してください。

## 管理者の同意を付与してセキュリティ データを表示する

### 範囲を割り当てる (アクセス許可)

1. 管理者に**アプリケーション ID** と前の手順で使用した**リダイレクト URI** を提供します。必要な同意 (アクセス許可) をアプリケーションに付与するには、組織の Azure Active Directory テナント管理者が必要です。
2. 組織のテナント管理者として、ブラウザー ウィンドウを開き、アドレス バーに次の URL を貼り付けます
(APPLICATION\_ID および REDIRECT\_URL の値を追加した後に行います): https://login.microsoftonline.com/common/adminconsent?client\_id=APPLICATION\_ID&state=12345&redirect\_uri=REDIRECT\_URL。
3. 認証後、テナント管理者には、次のようなダイアログが表示されます (アプリケーションが要求しているアクセス許可によって異なります)。

     ![範囲の同意ダイアログ](readme-images/Scope.PNG)

3. このダイアログで [承諾する] をクリックすることで、テナント管理者はこの組織のすべてのユーザーに対して、このアプリケーションの使用に関する同意を付与します。注:現段階でリダイレクト URL で実行されているアプリケーションがないため、エラー メッセージが表示されます。これは正常な動作です。
このエラー ページが表示されるまでに、テナント管理者の同意が付与されます。

    ![範囲の同意ダイアログ](readme-images/GrantError.png)

### 組織内のユーザーに Microsoft Graph Security API へのアクセスを許可する (必要な Azure ロールを割り当てる)

Microsoft Graph Security API を介してセキュリティ データにアクセスするには、クライアント アプリケーションに必要なアクセス許可を付与する必要があります。委任モードで操作する場合、アプリケーションにサインインするユーザーには Microsoft Graph Security API を呼び出すために認証を受ける必要もあります。</br>
このセクションでは、テナント管理者が組織内の特定のユーザーを承認する方法について説明します。

1. テナント管理者として [Azure Portal](https://portal.azure.com) に サインインします。

2. Azure Active Directory ブレードに移動します。

3. [**ユーザー**] を選択します。

4. Microsoft Graph Security API へのアクセスを承認するユーザー アカウントを選択します。

5. [**ディレクトリ ロール**] を選択します。

6. [**制限付き管理者**] ラジオボタンを選択し、**セキュリティ管理者**ロールの横にあるチェック ボックスをオンにします。

     ![ロールの同意ダイアログ](readme-images/SecurityRole.png)

7. ページの上部にある [**保存**] ボタンをクリックします

Microsoft Graph Security API を呼び出すアプリケーションの使用を承認されている組織内のユーザーごとに、この操作を繰り返します。現在、この許可をセキュリティ グループに付与することはできません。

> **注:**認証フローの詳細については、「[承認と Microsoft Graph Security API](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)」を参照してください。 

## Webhook のセットアップ

1. [ngrok](https://ngrok.com/download) をダウンロードします。
2. ngrok Web サイトの手順に従ってインストールします。
3. Windows を使用している場合、ngrok を実行します。"ngrok.exe http 3000" を実行して ngrok を開始し、localhost ポート 3000 へのトンネルを開きます。
4. 次に、ngrok url で `config.js` ファイルを更新します。

    ![Ngrok](readme-images/Ngrok.PNG)

## サンプルのビルドと実行

1. Node.js 用 Microsoft Graph 接続サンプルをダウンロードするか、クローンを作成します。

2. 任意の IDE を使って、**config.js** を開きます。

3. **clientId** と **clientSecret** のプレースホルダ―の値をアプリの登録時にコピーしたアプリケーション ID とパスワードと置き換えます。**notificationUrl** を ngrok 転送 URL に置き換えます。

4. コマンド プロンプトで、ルート ディレクトリで次のコマンドを実行します。これにより、プロジェクトの依存関係がインストールされます。

  ```npm のインストール```

 > **注:**
 コンピューターに Python 2.7 がインストールされていない場合、このプロセス中にエラーが発生する場合があります。エラーが発生した場合でも、Web アプリは引き続き動作します。

5. 次のコマンドを実行して開発用サーバーを起動します。

  ```node app.js```

6. Web ブラウザーで `http://localhost:3000/` に移動します。

7. [**Microsoft アカウントでサインイン**] ボタンをクリックします。

8. 個人用あるいは職場または学校のアカウントでサインインし、要求されたアクセス許可を付与します。

9. フィルター条件を定義して表示するアラートを選択し、[**アラートを受け取る**] ボタンをクリックします。操作が完了すると、フィルター条件に一致するアラートがページに表示されます。
呼び出しを行うために使用される SDK クエリと REST クエリも表示されます。REST クエリ リンクをクリックすると、**Graph エクスプローラー** にクエリが事前に入力された新しいタブが開きます。
    >**注:**アプリケーションは、フィルター条件に一致するテナントからセキュリティ アラートを取得しています。一覧に表示されているプロバイダーから一致するセキュリティ警告がない場合、"一致する警告が見つかりません" というメッセージが応答セクションに表示されます。Azure Security Center からサンプル アラートを生成するには、「[Security Center Alert Validation (セキュリティ センターのアラート検証)](https://docs.microsoft.com/en-us/azure/security-center/security-center-alert-validation)」をご覧ください。

10. 一致するアラートの一覧で、表示する特定のアラートの**タイトル**をクリックします。完全なアラートの詳細 (JSON) は、Web ページの右側にある [**アラートの詳細**] タブに表示されます。アラートに **user principal name** または **fully qualified domain name** プロパティが含まれている場合、アプリケーションは Microsoft Graph API を介して Azure Actove Directory に追加の呼び出しを行い、ユーザー アカウントとデバイスに関する追加の詳細情報を取得します。[**ユーザーとデバイスの詳細**] タブをクリックして、追加のユーザー データおよびデバイス データを表示します (存在する場合)。
11. アラートを更新するには、アラート ID を入力し、編集可能なプロパティの値を選択/入力して、[**アラートを更新する**] ボタンをクリックします。**元のアラートの詳細**と**更新されたアラートの詳細**は、Web ページの右側にある [**アラートの管理**] タブに表示されます。
12. webhook サブスクリプションを作成するには、ドロップダウンで少なくとも 1 つのプロパティを選択するか、FQDN または UPN を入力します。次に、[登録] をクリックすると、webhook サブスクリプションが作成されます。次に [通知] をクリックすると、別のページが開きます。このページには、Webhook 通知が表示されます。Webhook サブスクリプション リソースに一致するプロパティが更新されると、通知がアプリに送信され、通知ページに表示されます。
    >**注:**このサンプルがローカル マシンで実行されている場合、適切に通知を作成して受信するには [ngrok](#Webhook-setup) を使用する必要があります。

## 質問とコメント

Graph JavaScript SDK を使用した Node.js 用 Microsoft Graph Security API 接続サンプルについて、フィードバックをお寄せください。質問や提案は、このリポジトリの「[問題](https://github.com/microsoftgraph/nodejs-connect-sample/issues)」セクションで送信できます。

Microsoft Graph 開発全般の質問については、「[Microsoft TechCommunity](https://aka.ms/securitygraphcommunity)」または「[Stack Overflow](http://stackoverflow.com/questions/tagged/microsoft-graph-security)」に投稿してください。**Stack Overflow** では、質問やコメントには必ず [microsoft-graph-security] のタグを付けてください。

## 貢献 ##

これらのサンプルはオープン ソースであり、[MIT ライセンス](https://github.com/microsoftgraph/nodejs-security-sample/blob/master/LICENSE)の下でリリースされています。問題 (このサンプルに関する機能のリクエストや質問など) や[プル リクエスト](https://github.com/microsoftgraph/nodejs-security-sample/pulls)は歓迎します。Microsoft Graph Security API で見たい別のサンプルがある場合は、そのフィードバックも歓迎しますので、[問題](https://github.com/microsoftgraph/nodejs-security-sample/issues)を記録してお知らせください。

このプロジェクトでは、[Microsoft Open Source Code of Conduct (Microsoft オープン ソース倫理規定)](https://opensource.microsoft.com/codeofconduct/) が採用されています。詳細については、「[Code of Conduct の FAQ](https://opensource.microsoft.com/codeofconduct/faq/)」を参照してください。また、その他の質問やコメントがあれば、[opencode@microsoft.com](mailto:opencode@microsoft.com) までお問い合わせください。
  
## その他のリソース

- [Microsoft Graph Security API ドキュメント](https://aka.ms/securitygraphdocs)
- [Microsoft Graph での承認とセキュリティ API](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)
- [その他の Microsoft Graph 接続サンプル](https://github.com/MicrosoftGraph?utf8=%E2%9C%93&query=-Connect)
- [Microsoft Graph](http://graph.microsoft.io)

## 著作権
Copyright (c) 2018 Microsoft.All rights reserved.
