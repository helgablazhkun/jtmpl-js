$(document).ready(function () {
    if ('onhashchange' in window) {
        window.onhashchange = JumpToLine;
    }

    loadNumeration();
    loadVariables();

    $(".value").on('change keypress paste focus textInput input', function () {
        var value = $(this).val();
        var name = $(this).data('variableId');
        $("span[name='" + name + "']").each(function () {
            $(this).text(value);
        });
    });

    $(".btnPlus").on('click', function () {
        var className = $(this).data('variableId');
        var arrayRowTableId = $(this).data('arrayRowTableId');
        loadArrayVariableInputs(className, arrayRowTableId);
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

function loadArrayVariableInputs(arrayVariablesText, arrayRowTableId) {
    var arrays = getAllMatches(arrayVariablesText);
    var str = '<tr valign="left"><td>';
    arrays.forEach(function (item, index) {
        str += '<input type="text" class="code" value="' + item + '" /> &nbsp;';
    });
    str += '</td></tr>';
    $('#' + arrayRowTableId + ' tr:last').after(str);

}

function getVariableRegex() {
    return /\${(.*?)}/g;
}

function loadVariables() {
    var regex = getVariableRegex();
    var allSpans = $("span").filter(function () { return ($(this).text().match(regex)); });
    var arrayElements = $(":contains('ARRAY')").nextAll(".Comment").filter(function () { return ($(this).text().indexOf("${") > -1); });

    updateAllVariableElements(allSpans, arrayElements);
    var variablesElements = $(".simpleVar");
    loadVariableTable(variablesElements);
    loadArrayVariables(arrayElements);
}

function getVariableName(str) {
    var regex = /{([^}]+)}/g;
    var matches = regex.exec(str);
    return matches && matches.length > 1 ? matches[1] : "";
}

function splitAllVariableSpans(allSpans, arrayTextArr, allArrayVariables) {
    var regex = getVariableRegex();
    allSpans.each(function () {
        var text = $(this).text();
        var variables = (text).match(regex);
        var isArrayVariable = $.inArray(text, arrayTextArr)!=-1;
        var spanClassName = isArrayVariable ? 'arrayVarElement' : 'simpleVarElement';
        if (variables && variables.length > 0) {
            var currentText = text;
            var newText = "";
            var name = getVariableName(text);
            variables.forEach(function (item) {
                var elClassName = $.inArray(item, allArrayVariables) != -1 ? 'arrayVar' : 'simpleVar';
                newText+="<span class='" + elClassName + "' name='" + name + "'>" + item + "</span>";
            })
            $(this).html(newText);
        }
        $(this).addClass(spanClassName);
    });
}

function updateAllVariableElements(allSpans, arrayElements) {
    var arrayTextArr = $.makeArray(arrayElements.map(function () {
        return $(this).text();
    })).distinct();

    var regex = getVariableRegex();
    var allArrayVariables = [];
    arrayTextArr.forEach(function(arrayText) {
        var variables = (arrayText).match(regex);
        variables.forEach(function(item) {
            allArrayVariables.push(item);
        })
    });

    allArrayVariables = allArrayVariables.distinct();
    splitAllVariableSpans(allSpans, arrayTextArr, allArrayVariables);
}

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

    var rows = $.map(uniqueArrays, function (value, index) {

        var row = $("#arrayRowTemplate")
            .clone().removeAttr("id").show();

        var arrayName = createArrayName(value)

        var arrayRowTable = row.find(".arrayRowTable");
        var arrayRowTableId = "arrayRowTable_" + index;
        arrayRowTable.attr('id', arrayRowTableId);
        row.find(".arrayName").text(arrayName);
        var button = row.find(".btnPlus");
        button.data("variableId", arrayName);
        button.data("arrayRowTableId", arrayRowTableId);
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

    if (arrayFirstLine.indexOf(semicolonEnd) != -1) {
        return html.indexOf(semicolonEnd, startPosition) + 1;
    }

    if (arrayFirstLine.indexOf(bracketsEnd) != -1) {
        var brackets = 1;
        var i = html.indexOf(bracketsEnd, startPosition) + bracketsEnd.length;
        while (brackets != 0 && i < html.length) {
            if (html[i - 1] == " " && html[i] == "{")
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

function loadArrayVariables(arrays) {
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

function createVariableTable(variablesElements) {
    var newTable = $("#tableTemplate")
        .clone().removeAttr("id").show();

    var uniqueParameters = $.makeArray(variablesElements.map(function () {
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
    var regex = getVariableRegex();
    return str.match(regex);
}

function loadVariableTable(variablesElements) {
    createVariableTable(variablesElements);
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
