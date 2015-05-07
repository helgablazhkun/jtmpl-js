$(document).ready(function () {

    $('#downloadlink').click(function () {
        var htmlString = getHtmlWithoutElements('vimCodeElement', 'LineNr');
        downloadInnerHtml(htmlString, 'text/plain');
    });
});

function getKeysForRemoveLines() {
    return ['ARRAY', 'NOTE', 'INOTE'];
}

function getKeysForRemoveTextBefore() {
    return [
        'access',
        'access-profile',
        'accounting-options',
        'applications',
        'apply-groups',
        'bridge-domains',
        'chassis',
        'class-of-service',
        'diameter',
        'dynamic-profiles',
        'event-options',
        'fabric',
        'firewall',
        'forwarding-options',
        'groups',
        'interfaces',
        'jsrc',
        'jsrc-partition',
        'logical-systems',
        'multi-chassis',
        'multicast-snooping-options',
        'poe',
        'policy-options',
        'protocols',
        'routing-instances',
        'routing-options',
        'security',
        'services',
        'snmp',
        'switch-options'
    ];
}

function getHtmlWithoutTextBeforeKeys(html) {
    var keys = getKeysForRemoveTextBefore();
    var i = 0;
    var index = -1;
    while (i < keys.length && index<=-1) {
        var key = keys[i];
        var regex = new RegExp('^\\b' + key + '\\b\\s+{\\s*', 'm');
        var index = html.regexIndexOf(regex, 0);
        if (index > -1) {
            html = html.replaceBetween(0, index, '');
        }
        i++;
    };
    return html;
}


function getHtmlWithoutLinesWithKeys(html) {
    var keys = getKeysForRemoveLines();
    keys.forEach(function (key) {
        var regex = new RegExp('\\n(.*)\\b' + key + '\\b(.*)\\n', 'g');
        html = html.replace(regex, '\n');
    });
    return html;
}

function getHtmlWithounNumerationElements(rootElementId, classToRemove) {
    var html = $('#' + rootElementId).clone().find('.' + classToRemove)
        .text("")
        .replaceWith(function () { return this.innerHTML; })
        .end()
        .html();

    return strip(html);
}

function getHtmlWithoutElements(rootElementId, classToRemove) {
    var html = getHtmlWithounNumerationElements(rootElementId, classToRemove);
    html = getHtmlWithoutLinesWithKeys(strip(html));
    html = getHtmlWithoutTextBeforeKeys(html)
    return html;
}

function downloadInnerHtml(htmlString, mimeType) {
    var filename = getCurentFileName();
    filename = buildCompiledFileName(filename, "txt");
    var link = createFakeLink(filename, mimeType, htmlString);
    fireEvent(link, 'click');

}

function createFakeLink(filename, mimeType, htmlString)
{
    var link = document.createElement('a');
    mimeType = mimeType || 'text/plain';

    link.setAttribute('download', filename);
    link.setAttribute('href', 'data:' + mimeType + ';charset=utf-8,' + encodeURIComponent(htmlString));

    return link;
}

function fireEvent(element, eventName) {
    var event = new MouseEvent(eventName, {
        'view': window,
        'bubbles': true,
        'cancelable': true
    });
    return !element.dispatchEvent(event);
}

function getCurentFileName() {
    var pagePathName = window.location.pathname;
    var fullPath=pagePathName.substring(pagePathName.lastIndexOf("/") + 1);
    if (fullPath && fullPath.length > 0)
        return fullPath.split('.')[0];
    return "";
}

function buildCompiledFileName(filename, ext) {
    return filename + "-compileled" + "." + ext;
}