Array.prototype.distinct = function () {
    var arr = this;
    var newArray = [];
    for (var i = 0, j = arr.length; i < j; i++) {
        if (newArray.indexOf(arr[i]) == -1)
            newArray.push(arr[i]);
    }
    return newArray;
}
