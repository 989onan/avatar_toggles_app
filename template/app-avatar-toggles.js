//
//  app-template.js
//
//  Created by Alezia Kurdis, February 24th 2023.
//  Copyright 2023 Overte e.V.
//
//  This is a template of a typical application using a HTML ui.
//  You can use it to start to build your own project.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function() {
    var jsMainFileName = "app-avatar-toggles.js"; // <=== REPLACE VALUE (File name of this current .js file)
    var ROOT = Script.resolvePath('').split(jsMainFileName)[0];
    
    var APP_NAME = "Shapekey Changer"; // <=== REPLACE VALUE (Caption of the Tablet button.)
    var APP_URL = ROOT + "template.html"; // <=== REPLACE VALUE (html page that will be your UI)
    var APP_ICON_INACTIVE = ROOT + "icon_template_inactive.png"; // <=== REPLACE VALUE (Provide a 50 X 50 pixels, .png or .svg file, WHITE on transparent background)
    var APP_ICON_ACTIVE = ROOT + "icon_template_active.png"; // <=== REPLACE VALUE  (Provide a 50 X 50 pixels, .png or .svg file, BLACK on transparent background)
    var appStatus = false;
    var channel = "overte.application.more.avatar_manager"; // <=== REPLACE VALUE  (This must be a string specific to this application for a private communication between the app and its UI(html). The value must the same in template.html too.)
    var timestamp = 0;
    var INTERCALL_DELAY = 200; //0.3 sec
    
    var tablet = Tablet.getTablet("com.highfidelity.interface.tablet.system");

    tablet.screenChanged.connect(onScreenChanged);

    var button = tablet.addButton({
        text: APP_NAME,
        icon: APP_ICON_INACTIVE,
        activeIcon: APP_ICON_ACTIVE
    });


    function clicked(){
        if (appStatus === true) {
            tablet.webEventReceived.disconnect(onAppWebEventReceived);
            tablet.gotoHomeScreen();
            appStatus = false;
        }else{
            //Launching the Application UI.
            tablet.gotoWebScreen(APP_URL); // <== Data can be transmitted at opening of teh UI by using GET method, through paramater in the URL. + "?parameter=value"
            tablet.webEventReceived.connect(onAppWebEventReceived);
            appStatus = true;
        }

        button.editProperties({
            isActive: appStatus
        });
    }

    button.clicked.connect(clicked);

    //This recieved the message from the UI(html) for a specific actions
    function onAppWebEventReceived(message) {
        if (typeof message === "string") {
            var d = new Date();
            var n = d.getTime();
            var instruction = JSON.parse(message);
            if (instruction.channel === channel) {
                if (instruction.action === "HUMAN_CALLED_ACTION_NAME" && (n - timestamp) > INTERCALL_DELAY) { //<== Use this for action trigger by a human (button or any ui control). The delay prevent multiple call to destabilize everything. 
                    d = new Date();
                    timestamp = d.getTime();
                    //Call a function to do something here
                } else if (instruction.action === "SCRIPT_CALLED_ACTION_NAME") { //<== Use this for action trigger the UI script processing. (whithout delay)
                    //Call a function to do something here
                } else if (instruction.action === "SELF_UNINSTALL" && (n - timestamp) > INTERCALL_DELAY) { //<== This is a good practice to add a "Uninstall this app" button for rarely used app. (toolbar has a limit in size) 
                    d = new Date();
                    timestamp = d.getTime();
                    ScriptDiscoveryService.stopScript(Script.resolvePath(''), false);   
                } else if (instruction.action === "SELF_SET_BLENDSHAPE"){
                    
                    MyAvatar.hasScriptedBlendshapes = true;
                    
                    MyAvatar.setBlendshape(instruction.data.blendshape.name,  instruction.data.blendshape.value);
                    console.log(instruction.data.blendshape.name+" was changed to " + instruction.data.blendshape.value.toString());
                    
                    //Script.setTimeout(function () {
                    //    MyAvatar.hasScriptedBlendshapes = false;
                    //}, 10000);
                    
                }
            }
        }
    }
    
     function sendToWeb(command, data) {
        var dataToSend = {
            "app": "avtar_toggles",
            "command": command,
            "data": data
        };
        
        tablet.emitScriptEvent(JSON.stringify(dataToSend));
    }

    //============ Add your application functions here ==================

    //Here an example of a function that would communicate data to the UI(html) for a specific action
/*
    function testCallingTheUItoSendData() {
        //ADD PROCESSING HERE

        var message = {
            "channel": channel,
            "action": "CALL_HTML_UI_ACTION_NAME",
            "data": "Hello World!"
        };

        tablet.emitScriptEvent(JSON.stringify(message));
    }
*/
    //==================================================================

    function onScreenChanged(type, url) {
        if (type === "Web" && url.indexOf(APP_URL) !== -1) {
            appStatus = true;
            //Here we know that the HTML UI is loaded.
            //We could communitate to it here as we know it is loaded.
            //testCallingTheUItoSendData();

        } else {
            appStatus = false;
        }
        
        button.editProperties({
            isActive: appStatus
        });
    }

    function cleanup() {

        if (appStatus) {
            tablet.gotoHomeScreen();
            tablet.webEventReceived.disconnect(onAppWebEventReceived);
        }

        tablet.screenChanged.disconnect(onScreenChanged);
        tablet.removeButton(button);
    }

    Script.scriptEnding.connect(cleanup);
}());
