define(["require", "core-components/client_util"],
        function (require, ClientUtil) {

    function SubsequentViewHandler(viewContext) {
        this.viewContext = viewContext;
        this.root = viewContext.getRoot();

        this.root.on("click", "a", ClientUtil.bind(this._handleViewRequest, this));
    }

    SubsequentViewHandler.prototype._handleViewRequest = function (event) {
        var url = $(event.target).attr("href"),
            localRequest = /^\.{0,2}\//;

        if (localRequest.test(url)) {
            $.ajax({
                headers:    {
                    Accept: "text/json"
                },
                dataType:   "json",
                url:        url
            }).done(ClientUtil.bind(this._onLocalRequestDone, this));
        } else {
            window.open(url, "_blank");
        }

        event.preventDefault();
    }

    SubsequentViewHandler.prototype._onLocalRequestDone = function (component) {
        var Registry = require("core-components/raintime/raintime").ComponentRegistry,
            domId = this.viewContext.moduleId,
            componentParts,
            componentRoot,
            head = $("head");

        componentParts = component.content.match(/<body>\s*(<div[^>]*>[\s\S]*<\/div>)\s*<\/body>/);
        if (componentParts && componentParts.length === 2) {
            componentRoot = $(componentParts[1]).attr("data-instanceid", domId);
            this.root.replaceWith(componentRoot);
        }

        
        component.dependencies.css.forEach(function (url) {
            head.append('<link rel="stylesheet" href="' + url + '">');
        });

        Registry.deregister(domId);
        Registry.register({
            domId: domId,
            clientcontroller: component.clientcontroller
        });
    }

    return SubsequentViewHandler;
});
