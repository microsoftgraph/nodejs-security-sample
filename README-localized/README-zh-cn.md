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
\# 针对 Node.js 的 Microsoft Graph 安全性 API 连接示例

## 目录

* [简介](#introduction)
* [先决条件](#prerequisites)
* [注册应用程序](#register-the-application)
* [生成并运行示例](#build-and-run-the-sample)
* [问题和意见](#questions-and-comments)
* [参与](#contributing)
* [其他资源](#additional-resources)

## 简介

此示例演示如何使用 Microsoft Graph API 和 [Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript) 将 Node.js 应用连接到 Microsoft 工作或学校 (Azure Active Directory) 帐户或个人 (Microsoft) 帐户以检索安全性警报和更新警报。

![针对 Node.js 的 Microsoft Graph 连接示例的屏幕截图](readme-images/Webapp.PNG)

## 先决条件

若要使用针对 Node.js 的 Microsoft Graph 连接示例，需满足以下条件：

* [node.js](https://nodejs.org/) 版本 > = 7.6.0。

* 一个 [Microsoft 帐户](https://www.outlook.com/)或者一个[工作或学校帐户](http://dev.office.com/devprogram)

* 用于接收 Webhook 通知的 [Ngrok](https://ngrok.com/download)。

## 注册应用程序

若要配置示例，需要在 Microsoft [应用程序注册门户](https://go.microsoft.com/fwlink/?linkid=2083908)中注册新的应用程序。

请按照以下步骤注册新应用程序：

1. 使用个人帐户或者工作或学校帐户登录到 [Azure 应用注册门户](https://go.microsoft.com/fwlink/?linkid=2083908)。

2. 选择“**新注册**”。输入 *http://localhost:3000/token* 作为“重定向 URI”。

3. 输入应用名称，然后选择“**注册**”。
    > **注意：**如果希望你的应用程序是多租户型的，请在“**支持的帐户类型**”部分中选择“`任何组织目录中的帐户`”。

4. 接下来，你将看到应用的概述页面。复制并保存“**应用程序 ID**”字段。稍后将需要用它来完成配置过程。

5. 在“**证书和密码**”下，选择“**新建客户端密码**”，然后添加简短说明。新的密码将显示在“**值**”列中。复制此密码。稍后将需要用它来完成配置过程。

6. 在“**API 权限**”下，选择“**添加权限**”>“**Microsoft Graph**”。

7. 在“**委派的权限**”下，添加示例所需的权限/作用域。此示例需要 **User.Read.All**、**SecurityEvents.ReadWrite.All** 和 **SecurityActions.ReadWrite.All** 权限。
    >**注意**：有关 Graph 的权限模型的详细信息，请参阅 [Microsoft Graph 权限引用](https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference)。

## 授予查看安全性数据的管理员许可

### 分配作用域（权限）

1. 向管理员提供在前面的步骤中使用的“**应用程序 ID**”和“**重定向 URI**”。组织的 Azure Active Directory 租户管理员需要向应用程序授予所需的许可（权限）。
2. 作为组织的租户管理员，请打开浏览器窗口，然后将以下 URL 粘贴到地址栏中
（在添加 APPLICATION\_ID 和 REDIRECT\_URL 所对应的值后）：https://login.microsoftonline.com/common/adminconsent?client\_id=APPLICATION\_ID&state=12345&redirect\_uri=REDIRECT\_URL。
3. 进行身份验证后，租户管理员将会看到如下所示的对话框（具体取决于应用程序所请求的权限）：

     ![作用域许可对话框](readme-images/Scope.PNG)

3. 通过在此对话框中单击“接受”，租户管理员将向此组织的所有用户授予使用此应用程序的许可。
注意：由于目前没有在重定向 URL 处运行任何应用程序，你将收到一条错误消息。此行为是正常的。显示此错误页面时，已经授予了租户管理员许可。

    ![作用域许可对话框](readme-images/GrantError.png)

### 授权组织中的用户访问 Microsoft Graph 安全性 API（分配所需的 Azure 角色）

若要通过 Microsoft Graph 安全性 API 访问安全性数据，必须向客户端应用程序授予所需的权限，并且当在委派模式下操作时，登录到该应用程序的用户还必须获得调用 Microsoft Graph 安全性 API 的授权。</br>
本节介绍租户管理员如何对组织中的特定用户进行授权。

1. 以租户管理员身份登录到 [Azure 门户](https://portal.azure.com)。

2. 导航到“Azure Active Directory”边栏选项卡。

3. 选择“**用户**”。

4. 选择你要授权访问 Microsoft Graph 安全性 API 的用户帐户。

5. 选择“**目录角色**”。

6. 选择“**受限管理员**”单选按钮，然后选择“**安全管理员**”角色旁边的复选框

     ![角色许可对话框](readme-images/SecurityRole.png)

7. 单击页面顶部的“**保存**”按钮

如果组织中还有其他用户被授权使用将调用 Microsoft Graph 安全性 API 的应用程序，对每个这种用户重复此操作。目前，无法将此权限授予安全组。

> **注意：**有关授权流的更多详细信息，请参阅[授权和 Microsoft Graph 安全性 API](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization) 

## Webhook 设置

1. 下载 [ngrok](https://ngrok.com/download)。
2. 按照 ngrok 网站上的安装说明进行操作。
3. 如果你使用的是 Windows，请运行 ngrok。运行“ngrok.exe http 3000”来启动 ngrok，并打开一个到 localhost 端口 3000 的隧道。
4. 然后使用 ngrok url 更新 `config.js` 文件。

    ![Ngrok](readme-images/Ngrok.PNG)

## 生成并运行示例

1. 下载或克隆针对 Node.js 的 Microsoft Graph 连接示例。

2. 使用最喜爱的 IDE，打开 **config.js**。

3. 使用你在应用注册过程中复制的应用程序 ID 和密码替换 **clientId** 和 **clientSecret** 占位符值。将 **notificationUrl** 替换为 ngrok 转发 url。

4. 在命令提示窗口的根目录中运行以下命令。这将安装项目依赖项。

  ```npm 安装```

 > **注意：
 **如果计算机上未安装 Python 2.7，则此过程中可能会出现错误。如果发生错误，Web 应用仍将正常工作。

5. 运行以下命令以启动开发服务器。

  ```node app.js```

6. 在 Web 浏览器中导航到 `http://localhost:3000/`。

7. 单击“**Microsoft 登录**”按钮。

8. 使用个人帐户或者工作或学校帐户登录，并授予所请求的权限。

9. 通过定义筛选条件选择要查看的警报，然后单击“**获取警报**”按钮。操作完成后，页面上将显示符合筛选条件的警报。还将显示用于进行调用的 SDK 查询和 REST 查询。
单击 REST 查询链接将打开一个新的选项卡，其中的“**Graph 浏览器**”预先填充了你的查询。
    >**注意：**应用程序将从你的租户检索符合筛选条件的安全警报。如果列出的提供方没有匹配的安全警报，则响应部分将显示“没有匹配的警报”。若要从 Azure 安全中心生成示例警报，请参阅[安全中心警报验证](https://docs.microsoft.com/en-us/azure/security-center/security-center-alert-validation)

10. 在匹配警报列表中，单击要查看的特定通知的“**标题**”。完整的警报详细信息 (JSON) 将显示在网页右侧的“**警报详细信息**”选项卡中。如果警报包含“**用户主体名称**”或“**完全限定的域名**”属性，该应用程序将通过 Microsoft Graph API 再次调用 Azure Active Directory，以便检索有关用户帐户和设备的其他详细信息。单击“**用户和设备详细信息**”选项卡，查看其他用户和设备数据（如果存在）。
11. 若要更新警报，请输入警报 ID，选择/输入可编辑属性所对应的值，然后单击“**更新警报**”按钮。“**原始警报详细信息**”和“**已更新的警报详细信息**”显示在网页右侧的“**警报管理**”选项卡上。
12. 若要创建 Webhook 订阅，请在任何下拉列表中选择至少一个属性，或输入一个 FQDN 或 UPN。然后单击“订阅”，该操作将创建 Webhook 订阅。然后单击“通知”以打开另一个将显示 Webhook 通知的页面。如果与 Webhook 订阅资源匹配的属性进行了更新，则将会有一条通知发送到该应用并显示在通知页面上。
    >**注意：**如果你是在本地计算机上运行此示例，则应使用 [ngrok](#Webhook-setup) 来正确创建和接收通知。

## 问题和意见

对于针对 Node.js 的 Microsoft Graph 安全性 API（使用 Graph JavaScript SDK），我们非常乐意收到你的相关反馈。你可以在该存储库中的[问题](https://github.com/microsoftgraph/nodejs-connect-sample/issues)部分将问题和建议发送给我们。

与 Microsoft Graph 开发相关的一般问题应发布到 [Microsoft TechCommunity](https://aka.ms/securitygraphcommunity) 或 [Stack Overflow](http://stackoverflow.com/questions/tagged/microsoft-graph-security)。在 **Stack Overflow** 上，请确保你的问题或意见标记有 \[microsoft-graph-security]。

## 参与 ##

这些示例是在 [MIT 许可](https://github.com/microsoftgraph/nodejs-security-sample/blob/master/LICENSE)下发布的开放源代码。欢迎提出相关问题（包括有关此示例的功能请求和/或疑问）和[拉取请求](https://github.com/microsoftgraph/nodejs-security-sample/pulls)。如果你想查看 Microsoft Graph 安全性 API 的其他示例，我们也对相应反馈感兴趣，请记录[问题](https://github.com/microsoftgraph/nodejs-security-sample/issues)并通知我们！

此项目已采用 [Microsoft 开放源代码行为准则](https://opensource.microsoft.com/codeofconduct/)。有关详细信息，请参阅[行为准则常见问题解答](https://opensource.microsoft.com/codeofconduct/faq/)。如有其他任何问题或意见，也可联系 [opencode@microsoft.com](mailto:opencode@microsoft.com)。
  
## 其他资源

- [Microsoft Graph 安全性 API 文档](https://aka.ms/securitygraphdocs)
- [Microsoft Graph 中的授权和安全性 API](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)
- [其他 Microsoft Graph 连接示例](https://github.com/MicrosoftGraph?utf8=%E2%9C%93&query=-Connect)
- [Microsoft Graph](http://graph.microsoft.io)

## 版权信息
版权所有 (c) 2018 Microsoft。保留所有权利。
