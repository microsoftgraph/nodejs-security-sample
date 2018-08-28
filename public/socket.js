/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

const socket = io.connect('http://localhost:3000');

socket.on('notification_received', webhookData => {
    console.log("webhookData : ", webhookData);
    webhookData.value.forEach(message => {
        let panel = document.createElement("div");
        panel.className = "panel panel-primary";
        let panelBody = document.createElement("div");
        panelBody.className = "panel-body";
       

        let table = document.createElement("table");
        table.className = 'table table-hover';
        let thead = document.createElement("thead");
        let tr = document.createElement("tr");
        let property = document.createElement("th");
        property.innerText = "Property"
        let details = document.createElement("th");
        details.innerText = "Details";
        let tbody = document.createElement('tbody');
        

        for (prop in message) {
            let tr = document.createElement('tr');
            let td1 = document.createElement('td');
            td1.innerText = prop;
            let td2 = document.createElement('td');
            if (prop === "resourceData") {
                td2.innerHTML = JSON.stringify(message[prop], undefined, 4);
            } else if (prop !== "clientState" ){
                td2.innerText = message[prop];
            }

            tr.appendChild(td1);
            tr.appendChild(td2);
            tbody.appendChild(tr);
        }

       
        tr.appendChild(property);
        tr.appendChild(details);
        thead.appendChild(tr);
        table.appendChild(thead);
        table.appendChild(tbody);
        panelBody.appendChild(table);
        panel.appendChild(panelBody);

        document.getElementById('notifications').appendChild(panel);
    });
});    

socket.emit('create_room', "test_room");

