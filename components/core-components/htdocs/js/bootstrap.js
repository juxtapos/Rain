require({
    baseUrl:"/components",
    paths:{
        "core-components": "core-components/htdocs/js/",
        "cockpit": "cockpit/htdocs/js/"
    },
    locale:"en-us"
});

require(['core-components/test']);
