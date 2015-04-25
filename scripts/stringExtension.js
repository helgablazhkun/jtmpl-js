String.prototype.regexIndexOf = function (regex, startpos) {
    var indexOf = this.substring(startpos || 0).search(regex);
    return (indexOf >= 0) ? (indexOf + (startpos || 0)) : indexOf;
}

String.prototype.replaceBetween = function (start, end, what) {
    return this.substring(0, start) + what + this.substring(end);
};

String.prototype.insert = function (index, string) {
    if (index > 0)
        return this.substring(0, index) + string + this.substring(index, this.length);
    else
        return string + this;
};

String.prototype.allIndexOf = function(toSearch){
    var indices = [];
    for (var pos = this.indexOf(toSearch); pos !== -1; pos = this.indexOf(toSearch, pos + 1)) {
        indices.push(pos);
    }
    return indices;
}