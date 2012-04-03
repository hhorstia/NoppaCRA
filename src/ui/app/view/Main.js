Ext.define("ui.view.Main", {
    extend: 'Ext.tab.Panel',
        
    config: {
        tabBarPosition: 'bottom',
        
        items: [
            {
                title: 'Welcome',
                iconCls: 'home',
                
                styleHtmlContent: true,
                scrollable: true,
                
                html: [
                    "Welcome to Noppa Course Recommendation Application. Please login to get more recommendation options and to view your own courses."
                ].join("")
            },
            {
                title: 'Courses',
                iconCls: 'search',
                
                styleHtmlContent: true,
                scrollable: true,
				
				html: [
				    "Recommendations view."
				].join("")
            },
            {
                title: 'My Courses',
                iconCls: 'user',
                disabled: true,
                
                styleHtmlContent: true,
                scrollable: true,
            	
            	html: [
            	    "Own courses view."
            	].join("")
            },
            {
                title: 'More',
                iconCls: 'more',
                                
                styleHtmlContent: true,
                scrollable: true,
            	
            	html: [
            	    "More view."
            	].join("")
            }
        ]
    }
});