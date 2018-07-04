var yooLib = new function() {

var initPublic = function(obj) {
    obj.$ = $;
    obj.clearElement = clearElement;
    obj.addHandler = addHandler;
    obj.removeHandler = removeHandler;
    obj.getTarget = getTarget;
    obj.findParent = findParent;
    obj.parentNode = parentNode;
    obj.preventDefault = preventDefault;
    obj.calculateAbsoluteOffset = calculateAbsoluteOffset;
    obj.extractPixelValue = extractPixelValue;
    obj.move = move;
};

var $ = function(id) {
    return document.getElementById(id);
};

var clearElement = function(elem) {
    if (elem != null) {
        while (elem.hasChildNodes()) {
            elem.removeChild(elem.firstChild);
        }
    }
};

var addHandler = function(object, event, handler) {
    if (typeof object.addEventListener != 'undefined') {
        object.addEventListener(event, handler, false);
    } else if (typeof object.attachEvent != 'undefined') {
        object.attachEvent('on' + event, handler);
    } else
        throw "Incompatible browser";
};

var removeHandler = function(object, event, handler) {
    if (typeof object.removeEventListener != 'undefined') {
        object.removeEventListener(event, handler, false);
    } else if (typeof object.detachEvent != 'undefined') {
        object.detachEvent('on' + event, handler);
    } else
        throw "Incompatible browser";
};

var getTarget = function(e) {
    return typeof(e.target) != 'undefined' ? e.target : e.srcElement;
};

var findParent = function(ctrl, tagName) {
    let node = ctrl;
    for(;;) {
        if (typeof(node.tagName) != 'string') return null;
        if (node.tagName.toUpperCase() == tagName.toUpperCase()) return node;

        node = parentNode(node);
        if (node == null) return null;
    }
};

var parentNode = function(node) {
    return typeof(node.parentNode) != 'undefined' ? node.parentNode : node.parentElement;
};

var preventDefault = function(event) {
    if (typeof(event.preventDefault) != 'undefined') {
        event.preventDefault();
    }
};

var calculateAbsoluteOffset = function(ctrl) {
    let elem = ctrl;

    let left = 0;
    let top = 0;

    while (elem) {
        left += elem.offsetLeft;
        top += elem.offsetTop;
        elem = elem.offsetParent;
    }

    let retValue = new Object();
    retValue.left = left;
    retValue.top = top;
    return retValue;
};

var extractPixelValue = function(s) {
    let suffix = s.length >= 2 ? s.substr(s.length-2, 2) : '';
    if (suffix.toLowerCase() == 'px') {
        s = s.substr(0, s.length - 2);
    }
    return parseInt(s);
}

var move = function(ctrl, deltaX, deltaY) {
    let left = extractPixelValue(ctrl.style.left);
    let top = extractPixelValue(ctrl.style.top);
    ctrl.style.left = left + deltaX + 'px';
    ctrl.style.top = top + deltaY + 'px';
};

initPublic(this);

}; // yooLib
