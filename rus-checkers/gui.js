var yooRusCheckers = new function() {

var initPublic = function(obj) {
    obj.init = init;
};

var logic;

var init = function(args) {
    logic = yooRusCheckersLogic;

    let position = logic.parseFen(args['fen']);
    if (typeof(position) != 'object') {
        console.log(position);
        return;
    }

    let div = yooLib.$(args['divId']);
    div.rotated = args['rotated'] ? 1 : 0;
    div.tag = args['tag'];
    div.position = position;
    refresh(div);
};

var refresh = function(div) {
    console.log('Not implemented.');
};

initPublic(this);

}; // yooRusCheckers
