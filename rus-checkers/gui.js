var yooRusCheckersConfig = {
    bitmapWidth     : 50,
    bitmapHeight    : 50,
    tableBorder     : '2px solid black',
    fieldColorWhite : 'white',
    fieldColorBlack : '#888888',
    pieceDir        : './rus-checkers/img/',
    pieceImages     : { 'w': 'E3.png', 'W': 'E2.png', 'b': 'E1.png', 'B': 'E0.png' },
    copyright       : "mustitz@gmail.com"
};



var yooRusCheckers = new function() {

var initPublic = function(obj) {
    obj.init = init;
};

var logic;
var cfg = yooRusCheckersConfig;

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

var getBoardIndex = function(file, rank, isRotated) {
    if (isRotated) {
        rank = 7 - rank;
        file = 7 - file;
    }
    return file + 16 * rank;
};

var refresh = function(div) {
    yooLib.clearElement(div);
    div.boardTds = [];

    let table = document.createElement('TABLE');
    table.style.padding = '0px';
    table.style.borderSpacing = '0px';
    table.style.minWidth = 8*cfg.bitmapWidth + 'px';
    table.style.border = cfg.tableBorder;

    let tbody = document.createElement('TBODY');

    for (let rank=7; rank>=0; --rank) {
        let tr = document.createElement('TR');
        tr.style.height = cfg.bitmapHeight + 'px';

        for (let file=0; file<8; ++file) {
            let td = document.createElement('TD');
            td.style.width = cfg.bitmapWidth + 'px';
            td.style.height = cfg.bitmapHeight + 'px';

            let isWhiteSquare = (file ^ rank) & 1;
            if (isWhiteSquare) {
                td.style.backgroundColor = cfg.fieldColorWhite;
                tr.appendChild(td);
                continue;
            }

            let tdDiv = document.createElement('DIV');
            tdDiv.style.width = cfg.bitmapWidth + 'px';
            tdDiv.style.height = cfg.bitmapHeight + 'px';
            tdDiv.style.overflow = 'hidden';
            tdDiv.style.backgroundColor = cfg.fieldColorBlack;

            td.index = getBoardIndex(file, rank, div.rotated);
            td.div = div;

            let what = div.position.board[td.index];
            if (typeof(what) == 'string') {
                let filename = cfg.pieceImages[what];
                tdDiv.style.backgroundImage = 'url(' + cfg.pieceDir + filename + ')';
                tdDiv.style.backgroundPosition = 'center';
            }

            div.boardTds[td.index] = td;

            td.innerDiv = tdDiv;
            td.appendChild(tdDiv);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    div.appendChild(table);
};

initPublic(this);

}; // yooRusCheckers
