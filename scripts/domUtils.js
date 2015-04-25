var convertDomElementToString = (function () {
    var DIV = document.createElement("div");

    if ('outerHTML' in DIV)
        return function (node) {
            return node.outerHTML;
        };

    return function (node) {
        var div = DIV.cloneNode();
        div.appendChild(node.cloneNode(true));
        return div.innerHTML;
    };

})();

function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}
