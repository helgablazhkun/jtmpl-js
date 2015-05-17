$(document).ready(function () {
    if ('onhashchange' in window) {
        window.onhashchange = JumpToLine;
    }

    loadNumeration();
    loadVariables();

    onPlusButtonClick();
    subscribeOnInputChange();
});

function subscribeOnInputChange() {
    $(".value").on('change keypress paste focus textInput input', function () {
        onVariableChange($(this));
    });
}

function onVariableChange(el) {
    var value = el.val();
    var name = el.attr('variableId');
    $("span[name='" + name + "']").each(function () {
        $(this).text(value);
    });
}

function createArrayInputStrings(buttonItem, copy) {
    var arrayVariableText = buttonItem.data('variableId');
    var arrayRowTableId = buttonItem.data('arrayRowTableId');
    var clickCount = parseInt(buttonItem.data('clickCount')) + 1;
    var arrayVariablesDictionary = getUniqueArrayVariablesDictionary(arrayVariableText, clickCount);
    loadArrayVariableInputs(arrayRowTableId, arrayVariablesDictionary);
    buttonItem.data('clickCount', clickCount);
    subscribeOnInputChange();
    if(copy)
        copyArrayBlock(arrayVariableText, arrayVariablesDictionary);
}

function onPlusButtonClick() {
    $(".btnPlus").on('click', function () {
        createArrayInputStrings($(this),true);
    });
}

function copyArrayBlock(arrayVariableText, arrayVariablesDictionary)
{
    $("el[class='" + arrayVariableText + "']").each(function (i) {
        var el = $(this).clone();
        el.removeClass(arrayVariableText)
        var insertedClass = arrayVariableText + "_inserted"+"_"+i;
        el.addClass(insertedClass);
        el.find(".arrayVar").each(function () {
            var text = $(this).attr('variableId'); 
            var value = arrayVariablesDictionary[text];
            $(this).attr('name', value);
            $(this).text(text);
        });
        var lastInserted = $("el[class='" + insertedClass + "']");
        if (lastInserted.length > 0)
            lastInserted.last().after(el);
        else
            $(this).after(el);

        loadNumeration();
    });
}

function getUniqueArrayVariablesDictionary(arrayVariableText, clickCount)
{
    var arrays = getAllMatches(arrayVariableText);
    var arrayVariablesDictionary = {};
    arrays.forEach(function(item) {
        arrayVariablesDictionary[item] = item + "_" + clickCount;
    });
    return arrayVariablesDictionary;
}

function loadArrayVariableInputs(arrayRowTableId, arrayVariablesDictionary) {
    var str = '<tr valign="left"><td>';
    $.each(arrayVariablesDictionary, function (key, val) {
        str += '<input type="text" class="value" value="' + key + '" variableId="' + val + '" /> &nbsp;';
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
    var arrayElements = $(":contains('ARRAY')").next(".Comment").filter(function () { return ($(this).text().indexOf(": ${") > -1); });

    updateAllVariableElements(allSpans, arrayElements);
    var variablesElements = $(".simpleVar");
    loadVariableTable(variablesElements);
    loadArrayVariables(arrayElements);
}

function getVariableName(str) {
    var regex = getVariableRegex();
    var matches = regex.exec(str);
    return matches && matches.length > 0 ? matches[0] : "";
}

function splitAllVariableSpans(allSpans, arrayTextArr, allArrayVariables) {
    var regex = getVariableRegex();
    var arrayListCount = {};
    allSpans.each(function () {
        var text = $(this).text();
        var variables = (text).match(regex);
        var isArrayVariable = $.inArray(text, arrayTextArr)!=-1;
        var spanClassName = isArrayVariable ? 'arrayVarElement' : 'simpleVarElement';
        var currentText = text;
        if (variables && variables.length > 0) {
            var newText = "";
            var name = getVariableName(text);
            variables.forEach(function (item) {
                var isArr = $.inArray(item, allArrayVariables) != -1;
                if (isArr) {
                    if (arrayListCount[name]>=0)
                        arrayListCount[name]++;
                    else
                        arrayListCount[name] = 0;
                }
                var elClassName = isArr ? 'arrayVar' : 'simpleVar';
                orderedName = isArr ? name + "_" + arrayListCount[name]: name;
                currentText = currentText.replace(item, "<span class='" + elClassName + "' name='" + orderedName + "'"+ " variableId='" + name+"'>" + item + "</span>");
            })
            $(this).html(currentText);
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
        button.data("clickCount", 0);
        return row[0];
    });

    newTable.append(rows);

    $("#arrayTable")
        .empty()
        .append(newTable);
}

function getArrayFirstLine(startPosition, html) {
    var newLineKey = "LineNr";
    var flag = false;

    function hasKeyCommentWord(str) {
        var keys = ["# QUERY", "# NOTE", "# JNOTE", "* JNOTE"];
        var hasKey = !keys.every(function(key) {
            if (strip(str).indexOf(key) != -1)
                return false;
            else return true;
        });
        return hasKey;
    }

    while (!flag) {
        var arrayFirstLineStart = html.indexOf(newLineKey, startPosition);
        var arrayFirstLineEnd = html.indexOf(newLineKey, arrayFirstLineStart + newLineKey.length);
        var arrayFirstLine = html.substring(arrayFirstLineStart, arrayFirstLineEnd);
        
        if (hasKeyCommentWord(arrayFirstLine)) {
            startPosition = arrayFirstLineEnd;
        } else {
            flag = true;
        }
    }
    return {
        ArrayFirstLine: arrayFirstLine,
        StartPosition: startPosition
    };
}

function getArrayEndPosition(startPosition, html) {

    var arrayFirstLineObj = getArrayFirstLine(startPosition, html);
    var arrayFirstLine = arrayFirstLineObj.ArrayFirstLine;
    startPosition = arrayFirstLineObj.StartPosition;

    var semicolonEnd = ";\n";
    var bracketsEnd = " {\n";
    var openBracket = " {";

    if (arrayFirstLine.indexOf(semicolonEnd) != -1) {
        return html.indexOf(semicolonEnd, startPosition) + 1;
    }

    if (strip(arrayFirstLine).indexOf(bracketsEnd) != -1) {
        var brackets = 1;
        var i = html.indexOf(openBracket, startPosition) + openBracket.length;
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
    $(".btnPlus").each(function () {
        if ($(this).data('variableId')) {
            createArrayInputStrings($(this), false);
        }
    });
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
        input.attr("variableId", getVariableName(value));

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
