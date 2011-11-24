define(["core-components/client_util"], function (clientUtil) {
    function SubsequentViewHandler(viewContext) {
        this.root = viewContext.getRoot();

        $(root).on("click", "a", _handleViewRequest);
    }

    function _handleViewRequest(event) {
        var a = $(this)
          , url = a.attr("href")
          , localRequest = /^\.{0,2}\//;

        if (localRequest.test(url)) {
            $.ajax({
                accepts:    "text/json",
                dataType:   "json",
                url:        url
            }).done(_onLocalRequestDone);
        } else {
            window.open(url, "_blank");
        }

        event.preventDefault();
    }

    function _onLocalRequestDone(component) {
        console.log("subsequent view request: " + component);
    }

    return SubsequentViewHandler;
});
