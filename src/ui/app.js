//<debug>
Ext.Loader.setPath({
    'Ext': 'sdk/src'
});
//</debug>

Ext.application({
    name: 'ui',

    requires: [
        'Ext.MessageBox',
        'Ext.Ajax'
    ],

    views: ['Main'],
    viewport: {
        autoMaximize: true,
    },
    
    icon: {
        57: 'resources/icons/Icon.png',
        72: 'resources/icons/Icon~ipad.png',
        114: 'resources/icons/Icon@2x.png',
        144: 'resources/icons/Icon~ipad@2x.png'
    },
    
    phoneStartupScreen: 'resources/loading/Homescreen.jpg',
    tabletStartupScreen: 'resources/loading/Homescreen~ipad.jpg',

    launch: function() {
        // Destroy the #appLoadingIndicator element
        Ext.fly('appLoadingIndicator').destroy();

        // Initialize the main view
        Ext.Viewport.add(Ext.create('ui.view.Main'));
        Ext.Viewport.add({
            xtype: 'titlebar',
            docked: 'top',
            title: 'NoppaCRA',
            items: [
                {
                    align: 'left',
                    text: 'Login'
                },
                {
                    align: 'right',
                    text: 'Settings'
                },
            ]
        });
        
        Ext.Ajax.request({
            url: '../api/',
            method: 'POST',
        
            params: {
                method: 'getCourse',
                id: 1
            },
        
            success: function(response) {
                $.each($.parseJSON(response.responseText), function(key, val) {
                	if (key == 'value') {
                		console.log(val);
                		this.add({html: 'test'});
                	}
                });
            }
        });
    },

    onUpdated: function() {
        Ext.Msg.confirm(
            "Application Update",
            "This application has just successfully been updated to the latest version. Reload now?",
            function() {
                window.location.reload();
            }
        );
    }
});
