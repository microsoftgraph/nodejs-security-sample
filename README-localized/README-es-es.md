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
\# Ejemplo de conexión de la API Microsoft Graph Security para Node.js

## Tabla de contenido

* [Introducción](#introduction)
* [Requisitos previos](#prerequisites)
* [Registrar la aplicación](#register-the-application)
* [Compilar y ejecutar el ejemplo](#build-and-run-the-sample)
* [Preguntas y comentarios](#questions-and-comments)
* [Colaboradores](#contributing)
* [Recursos adicionales](#additional-resources)

## Introducción

Este ejemplo muestra cómo conectar una aplicación de Node.js a una cuenta de Microsoft profesional o educativa (Azure Active Directory) o a una cuenta personal (Microsoft) usando la API de Microsoft Graph y [el SDK de JavaScript de Microsoft Graph](https://github.com/microsoftgraph/msgraph-sdk-javascript) para recuperar alertas de seguridad y actualizar una alerta.

![Captura de pantalla de ejemplo de conexión de Microsoft Graph para Node.js](readme-images/Webapp.PNG)

## Requisitos previos

Para usar el Ejemplo de conexión de Microsoft Graph para Node.js, necesita lo siguiente:

* [Node.js](https://nodejs.org/) (versión 7.6.0 o posterior)

* Ya sea una [cuenta de Microsoft](https://www.outlook.com/) o una [cuenta profesional o educativa](http://dev.office.com/devprogram)

* [Ngrok](https://ngrok.com/download) para las notificaciones de webhook.

## Registrar la aplicación

Para configurar las muestras debe registrar una nueva aplicación en el [Portal de registro de aplicaciones de Microsoft](https://go.microsoft.com/fwlink/?linkid=2083908).

Siga estos pasos para registrar una nueva aplicación:

1. Inicie sesión en el [Portal de registro de aplicaciones de Azure](https://go.microsoft.com/fwlink/?linkid=2083908) mediante su cuenta personal, profesional o educativa.

2. Seleccione **Nuevo registro**. Escriba *http://localhost:3000/token* como URI de redireccionamiento.

3. Escriba un nombre para la aplicación y seleccione **Registrar**.
    > **Nota:** Si desea que la aplicación sea multiempresa, seleccione `cuentas en el directorio de la organización` en la sección **tipos de cuenta compatibles**.

4. Después, verá la página de información general de la aplicación. Copie y guarde el campo de **Id. de la aplicación**. Lo necesitará más adelante para completar el proceso de configuración.

5. En **Certificados y secretos**, elija **nuevo secreto de cliente** y añada una descripción rápida. Se mostrará un secreto nuevo en la columna **Valor**. Copie esta contraseña. Lo necesitará más adelante para completar el proceso de configuración.

6. En **permisos de la API**, elija **Agregar un permiso** > **Microsoft Graph**.

7. En **Permisos delegados**, agregue los permisos/ámbitos requeridos para el ejemplo. Este ejemplo requiere **User.Read.All**, **SecurityEvents.ReadWrite.All** y **SecurityActions.ReadWrite.All** permisos.
    >**Nota**: Para obtener más información sobre el modelo de permisos de Graph, vea [Referencias de permisos de Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/permissions_reference).

## Conceder consentimiento de administrador para ver datos de seguridad

### Asignar ámbito (permiso)

1. Proporcione al administrador el **identificador de la aplicación** y el **URI de redireccionamiento ** que utilizó en los pasos anteriores. El administrador de inquilinos de Azure Active Directory de la organización debe conceder consentimiento (permisos) a la aplicación.
2. Abra una pestaña en el navegador como administrador de inquilinos de su organización y pegue en
la barra de direcciones la siguiente URL (tras agregar los valores para APPLICATION\_ID y REDIRECT\_URL): https://login.microsoftonline.com/common/adminconsent?client\_id=APPLICATION\_ID&state=12345&redirect\_uri=REDIRECT\_URL.
3. Tras la autenticación, se le presentarán al administrador de inquilinos los siguientes cuadros de diálogo (dependiendo de los permisos que la aplicación solicite):

     ![Cuadro de diálogo de consentimiento del ámbito](readme-images/Scope.PNG)

3. Al hacer clic en “Aceptar” en este cuadro de diálogo el administrador de inquilinos concede consentimiento para el uso de esta aplicación a todos los usuarios de la organización. Nota: Al no haber ninguna aplicación en ejecución en la URL de redireccionamiento recibirá un mensaje de error. Éste es el comportamiento esperado.
El consentimiento del administrador de inquilinos se habrá concedido en el momento en el que se muestre la página de error.

    ![Cuadro de diálogo de consentimiento del ámbito](readme-images/GrantError.png)

### Autorice a los usuarios de su organización para que tengan acceso a la API de Microsoft Graph Security (asigne el rol requerido de Azure)

Para acceder a los datos de seguridad a través de la API de seguridad Microsoft Graph deben concederse a la aplicación cliente los permisos requeridos y al operar en Modo delegado, el usuario conectado a la aplicación debe estar autorizado para llamar a la API de Microsoft Graph Security.</br>
En esta sección, se describe cómo el administrador de inquilinos puede autorizar determinados usuarios de la organización.

1. Inicie sesión en [Azure Portal](https://portal.azure.com) como administrador de inquilinos.

2. Vaya al Centro de administración de Azure Active Directory.

3. Seleccione **Usuarios**.

4. Seleccione la cuenta de usuario a la que quiera autorizar para obtener acceso a la API de Microsoft Graph Security.

5. Seleccione **Rol de directorio**.

6. Seleccione el botón de radio de **Administrador limitado** y seleccione la casilla junto a rol de **Administrador de seguridad**

     ![Cuadro de diálogo de consentimiento de rol](readme-images/SecurityRole.png)

7. Haga clic en el botón **Guardar** en la parte superior de la pantalla.

Repita esta acción para todos los usuarios de la organización que estén autorizados para usar aplicaciones que llamen a la API de Microsoft Graph Security. Actualmente, no se puede conceder este permiso a grupos de seguridad.

> **Nota:** Para obtener más detalles acerca del flujo de autorización, vea [Autorización y la API Microsoft Graph Security](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization). 

## Configuración de webhook

1. Descargue [ngrok](https://ngrok.com/download).
2. Siga las instrucciones de instalación que aparecen en el sitio web de ngrok.
3. Si está usando Windows ejecute ngrok. Ejecute "ngrok. exe http 3000" para iniciar ngrok y abrir un túnel al puerto localhost 3000.
4. Después, actualice el archivo `config.js` con la URL ngrok.

    ![Ngrok](readme-images/Ngrok.PNG)

## Compilar y ejecutar el ejemplo

1. Descargue o clone el ejemplo de Microsoft Graph Connect para Node.js.

2. Con su IDE favorito, abra **configs.ts**.

3. Reemplace los valores de los marcadores de posición de **clientId** y **clientSecret** con el Id. de aplicación y la contraseña que ha copiado durante el registro de la aplicación. Reemplace **notificationUrl** por la dirección URL de reenvío de ngrok.

4. En un símbolo del sistema, ejecute el siguiente comando en el directorio raíz. Esta acción instalará las dependencias del proyecto.

  ```Instalar npm```

 > **Nota:**
 Es posible que se produzca un error durante este proceso si su equipo no tiene Python 2.7 instalado. Si el error se produce, la aplicación web seguirá funcionando.

5. Ejecute el siguiente comando para iniciar el servidor web.

  ```node app.js```

6. Navegue hasta `http://localhost:3000/` en el explorador web.

7. Haga clic en el botón **Iniciar sesión con Microsoft**.

8. Inicie sesión con su cuenta personal, profesional o educativa y conceda los permisos solicitados.

9. Seleccione las alertas que desea ver mediante la definición de criterios de filtrado y haga clic en el botón
**Recibir alertas**. Cuando la operación finalice, las alertas que coincidan con los criterios de filtrado se mostrarán en la página. También se muestran las consultas de SDK y REST que se usan para realizar la llamada. Al hacer clic en el vínculo de la consulta de REST se abrirá una nueva pestaña con el **Explorador de Graph** rellenado previamente con la consulta.
    >**Nota:** La aplicación recupera las alertas de seguridad de su espacio empresarial que coinciden con los criterios de filtro. Si no hay alertas de seguridad coincidentes de los proveedores indicados, se mostrará "Ninguna alerta coincidente" en la sección respuesta. Para generar alertas de ejemplo en Azure Security Center, vea [Validación de alertas de Security Center](https://docs.microsoft.com/en-us/azure/security-center/security-center-alert-validation)

10. En la lista de alertas coincidentes, haga clic en el **Título** de una alerta específica que quiera ver. Se mostrarán todos los detalles de la alerta (JSON) en la pestaña de **Detalles de alerta ** en el lado derecho de la página web. Si la alerta contiene propiedades del **nombre principal de usuario** o **el nombre de dominio completo**, la aplicación realizará una llamada adicional a Azure Actove Directory a través de la API de Microsoft Graph para recuperar información adicional sobre la cuenta de usuario y el dispositivo. Haga clic en la pestaña **Detalles de dispositivo y usuario** para ver datos de usuario y de dispositivo adicionales, si es que existen.
11. Para actualizar una alerta, escriba el ID. de alerta, elija o escriba los valores de las propiedades que se pueden modificar y haga clic en el botón **Actualizar alerta**. En la pestaña **Administración de alertas**, en el lado derecho de la página web, se muestran los **Detalles de alerta original** y **Datos de alerta actualizados**.
12. Para crear una suscripción de webhooks, seleccione al menos una propiedad en una lista desplegable o escriba un FQDN o un UPN. Después, haga clic en “suscribirse” y se creará una suscripción a webhook. Luego, haga clic en “Notificar” para abrir otra página donde se mostrarán las notificaciones de webhook. Si se actualiza una propiedad coincidente con su recurso de subscripción de webhook, se enviará un notificación a la aplicación y se mostrará en la página de notificaciones.
    >**Nota:** Si está ejecutando el ejemplo en su equipo local, debe usar [ngrok](#Webhook-setup) para crear y recibir notificaciones correctamente.

## Preguntas y comentarios

Nos encantaría recibir sus comentarios sobre el ejemplo de conexión de la API Microsoft Graph Security para node.js con el SDK de Graph JavaScript. Puede enviar sus preguntas y sugerencias en la sección [Problemas](https://github.com/microsoftgraph/nodejs-connect-sample/issues) de este repositorio.

Las preguntas sobre el desarrollo de Microsoft Graph en general deben publicarse en [Microsoft TechCommunity](https://aka.ms/securitygraphcommunity) o en [Stack Overflow](http://stackoverflow.com/questions/tagged/microsoft-graph-security). Asegúrese de que sus preguntas o comentarios en **Stack Overflow** se etiquetan con \[microsoft-graph-security].

## Colaboradores ##

Estos ejemplos son de código abierto, lanzados con la [licencia MIT](https://github.com/microsoftgraph/nodejs-security-sample/blob/master/LICENSE). Los comentarios (incluidas las solicitudes de características o las preguntas sobre este ejemplo) y las [solicitudes de incorporación de cambios](https://github.com/microsoftgraph/nodejs-security-sample/pulls) son bienvenidos. Si hay algún otro ejemplo que le gustaría ver para la API Microsoft Graph Security, también nos interesan estos comentarios: envíe un [problema](https://github.com/microsoftgraph/nodejs-security-sample/issues) y háganoslo saber.

Este proyecto ha adoptado el [Código de conducta de código abierto de Microsoft](https://opensource.microsoft.com/codeofconduct/). Para obtener más información, vea [Preguntas frecuentes sobre el código de conducta](https://opensource.microsoft.com/codeofconduct/faq/) o póngase en contacto con [opencode@microsoft.com](mailto:opencode@microsoft.com) si tiene otras preguntas o comentarios.
  
## Recursos adicionales

- [Documentación de la API Microsoft Graph Security](https://aka.ms/securitygraphdocs)
- [API de seguridad y autorización en Microsoft Graph](https://developer.microsoft.com/en-us/graph/docs/concepts/security-authorization)
- [Otros ejemplos de Microsoft Graph Connect](https://github.com/MicrosoftGraph?utf8=%E2%9C%93&query=-Connect)
- [Microsoft Graph](http://graph.microsoft.io)

## Derechos de autor
Copyright (c) 2018 Microsoft. Todos los derechos reservados.
