$(document).ready(function () {
    if ('onhashchange' in window) {
        window.onhashchange = JumpToLine;
    }

    loadNumeration();
    loadVariableTable();
    loadArrayVariables();

    $(".value").on('change keypress paste focus textInput input', function () {
        var value = $(this).val();
        var name = $(this).data('variableId');
        $("span[name='" + name + "']").each(function () {
            $(this).text(value);
        });
    });

    $(".btnPlus").on('click', function () {
        var className = $(this).data('variableId');
        $("el[class='" + className + "']").each(function () {
            var el = $(this).clone();
            el.removeClass(className)
            $(this).after(el);
            loadNumeration();
        });
    });

    /* $(document).on("change", ".value", function (event) {
         var value = $(this).val();
         var id = $(this).data('variableId');
         $('#' + id).text(value);
     });*/

});

function createArrayName(text) {
    var arrays = getAllMatches(text);
    var str = "";
    arrays.forEach(function (item, index) {
        if (index == 0)
            str += item;
        else
            str += " " + item;
    });

    return str;
}

function createArrayVariableTable(uniqueArrays) {
    var newTable = $("#arrayTableTemplate")
       .clone().removeAttr("id").show();

    var rows = $.map(uniqueArrays, function (value) {

        var row = $("#arrayRowTemplate")
            .clone().removeAttr("id").show()

        var arrayName = createArrayName(value)
        row.find(".arrayName").text(arrayName);
        var button = row.find(".btnPlus");
        button.data("variableId", arrayName);

        return row[0];
    });

    newTable.append(rows);

    $("#arrayTable")
        .empty()
        .append(newTable);
}

function getArrayEndPosition(startPosition, html) {
    var newLineKey = "LineNr";
    var arrayFirstLineStart = html.indexOf(newLineKey, startPosition);
    var arrayFirstLineEnd = html.indexOf(newLineKey, arrayFirstLineStart + newLineKey.length);
    var arrayFirstLine = html.substring(arrayFirstLineStart, arrayFirstLineEnd);
    var semicolonEnd = ";\n";
    var bracketsEnd = " {\n";

    if (arrayFirstLine.indexOf(semicolonEnd)!=-1) {
        return html.indexOf(semicolonEnd, startPosition) + 1;
    }

    if (arrayFirstLine.indexOf(bracketsEnd)!=-1) {
        var brackets = 1;
        var i = html.indexOf(bracketsEnd, startPosition) + bracketsEnd.length;
        while (brackets != 0 && i < html.length) {
            if (html[i-1] == " " && html[i] == "{")
                brackets++;
            if (html[i - 1] == " " && html[i] == "}")
                brackets--;
            i++;
        }
        return i;
    }
}

function createFakeElements(arrays) {
    var html = $("#vimCodeElement").html();
    arrays.forEach(function (value) {
        var arr = convertDomElementToString(value);
        var allIndexes = html.allIndexOf(arr);
        allIndexes.forEach(function (index, j) {
            var startPosition = index + arr.length;
            var classTitle = createArrayName(value.textContent);

            var newStartElement = "<el class='" + classTitle + "'>";
            var newEndElement = "</el>";

            if (j > 0)
                startPosition += (newStartElement.length + newEndElement.length);

            html = html.insert(startPosition, newStartElement);

            startPosition += newStartElement.length;
            endPosition = getArrayEndPosition(startPosition, html);
            
            html = html.insert(endPosition, newEndElement);
            
        })
    });
    $("#vimCodeElement").html(html)
}

function createUniqueArrayList(arrays, uniqueArraysText) {
    return $.map(uniqueArraysText, function (text) {
        return arrays.filter(function () { return ($(this).text() == text); })[0];
    })
}

function loadArrayVariables() {
    var arrays = $(":contains('ARRAY')").nextAll(".Comment").filter(function () { return ($(this).text().indexOf("${") > -1); });
    
    var uniqueArraysText = $.makeArray(arrays.map(function () {
        return $(this).text();
    })).distinct();

    var uniqueArrays = createUniqueArrayList(arrays, uniqueArraysText);
    createArrayVariableTable(uniqueArraysText);
    createFakeElements(uniqueArrays);
}

function loadNumeration() {
    function getNumberExponent(num, count) {
        var max = count.toString().length;
        return max - num.toString().length;
    }

    function getSpaceString(spaceCount) {
        var str = "";
        for (var j = 0; j < spaceCount; j++) {
            str += " ";
        }
        return str;
    }

    var allLineNrs = $(".LineNr");
    allLineNrs.each(function (index) {
        var i = index + 1;
        var spaceStr = getSpaceString(getNumberExponent(i, allLineNrs.length));
        $(this).attr('id', "L" + i);
        $(this).text(spaceStr + i + " ");
    });
}

function loadVariableId(allSpans) {
    allSpans.each(function () {
        $(this).attr('name', getVariableName($(this).text()));
        $(this).addClass('variable')
    });
}

function createVariableTable(allSpans) {
    var newTable = $("#tableTemplate")
        .clone().removeAttr("id").show();

    var uniqueParameters = $.makeArray(allSpans.map(function () {
        return $(this).text();
    })).distinct();

    var rows = $.map(uniqueParameters, function (value) {

        var row = $("#rowTemplate")
            .clone().removeAttr("id").show()

        row.find(".variableName").text(value);
        var input = row.find(".value");
        input.val(value);
        input.data("variableId", getVariableName(value));

        return row[0];
    });

    newTable.append(rows);

    $("#variablesTable")
        .empty()
        .append(newTable);
}

function getAllMatches(str) {
    var regex = /{([^}]+)}/g;
    return str.match(regex);
}

function getVariableName(str) {
    var regex = /{([^}]+)}/g;
    var matches = regex.exec(str);
    return matches && matches.length > 1 ? matches[1] : "";
}

function getVariableRegex() {
    return /\${(.*?)}/g;
}

function splitAllVariableSpans() {
    var regex = getVariableRegex();
    $("span").each(function () {
        if (!$(this).hasClass('Comment')) {
            var variables = ($(this).text()).match(regex);
            if (variables && variables.length > 1) {
                var currentText = $(this).text();
                var newText = currentText;
                variables.forEach(function (item) {
                    newText = newText.replace(item, '<span>' + item + '</span>');
                })

                $(this).text(newText);
            }
        }
    });
}

function loadVariableTable() {
    //splitAllVariableSpans();
    var regex = getVariableRegex();
    var allSpans = $("span").filter(function () { return (!$(this).hasClass('Comment')) && ($(this).text().match(regex)) });
    loadVariableId(allSpans);
    createVariableTable(allSpans);
}
/* function to open any folds containing a jumped-to line before jumping to it */
function JumpToLine() {
    var lineNum;
    lineNum = window.location.hash;
    lineNum = lineNum.substr(1); /* strip off '#' */

    if (lineNum.indexOf('L') == -1) {
        lineNum = 'L' + lineNum;
    }
    lineElem = document.getElementById(lineNum);
    /* Always jump to new location even if the line was hidden inside a fold, or
     * we corrected the raw number to a line ID.
     */
    if (lineElem) {
        lineElem.scrollIntoView(true);
    }
    return true;
}
