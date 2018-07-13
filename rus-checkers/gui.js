var yooRusCheckersConfig = {
    bitmapWidth     : 50,
    bitmapHeight    : 50,
    tableBorder     : '2px solid black',
    fieldColorWhite : 'white',
    fieldColorBlack : '#888888',
    pieceDir        : './rus-checkers/img/',
    pieceImages     : { 'w': 'E3.png', 'W': 'E2.png', 'b': 'E1.png', 'B': 'E0.png' },
    completeMove    : './rus-checkers/img/lime-border.png',
    partialMove     : './rus-checkers/img/blue-border.png',
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
    div.moveStage = [];
    div.partial = [];
    div.complete = [];

    if (div.isMouseDownHandler) {
        yooLib.removeHandler(div, 'mousedown', tdMouseDown);
        div.isMouseDownHandler = false;
    }

    if (typeof(div.dragDiv) !='undefined') {
        div.dragDiv.remove();
    }

    delete div.dragTd;
    delete div.dragDiv;
    delete div.dragLastX;
    delete div.dragLastY;

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

    if (!div.isMouseDownHandler) {
        yooLib.addHandler(div, 'mousedown', tdMouseDown);
        div.isMouseDownHandler = true;
    }
};

var tdMouseDown = function(e) {
    let td = yooLib.findParent(yooLib.getTarget(e), 'TD');
    if (td == null) return;
    if (typeof(td.index) == 'undefined') return;

    yooLib.preventDefault(e);

    let div = td.div;
    let position = div.position;

    moveList = logic.generateMoves(position);
    if (moveList.length == 0) return;

    let moveStage = div.moveStage.slice(0);
    moveStage.push(td.index);

    let stageStr = moveStage.map(logic.indexToSquare).join(':');
    let movesFromSquare = [];
    moveList.forEach(
        function(move) {
            if (move.startsWith(stageStr)) {
                movesFromSquare.push(move);
            }
        }
    );
    if (movesFromSquare.length == 0) return;

    div.moveStage = moveStage;

    let partial = [];
    let complete = [];
    let middle = [];
    let last = [];
    let fast = [];

    movesFromSquare.forEach(function(move) {
        let separator = move.charAt(2);
        let squares = move.split(separator);

        let stage = div.moveStage.length;
        if (typeof(squares[stage]) == 'string') {
            let sqIndex = logic.squareToIndex(squares[stage]);
            if (squares.length == stage + 1) {
                last[sqIndex] = move;
            } else {
                middle[sqIndex] = move;
            }
        }

        let lastIndex = squares.length - 1;
        let sqIndex = logic.squareToIndex(squares[lastIndex]);
        if (typeof(fast[sqIndex]) != 'string') {
            fast[sqIndex] = move;
        } else {
            fast[sqIndex] = '-';
        }
    });

    last.forEach(function(move, square) {
        complete[square] = move;
        let img = document.createElement('IMG');
        img.src = cfg.completeMove;
        div.boardTds[square].innerDiv.appendChild(img);
    });

    middle.forEach(function(move, square) {
        let ignored = typeof(last[square]) == 'string';
        if (ignored) return;

        partial[square] = move;
        let img = document.createElement('IMG');
        img.src = cfg.partialMove;
        div.boardTds[square].innerDiv.appendChild(img);
    });

    fast.forEach(function(move, square) {
        let ignored = 0
            || move == '-'
            || typeof(last[square]) == 'string'
            || typeof(middle[square]) == 'string'
        ;
        if (ignored) return;

        complete[square] = move;
        let img = document.createElement('IMG');
        img.src = cfg.completeMove;
        div.boardTds[square].innerDiv.appendChild(img);
    });

    div.partial = partial;
    div.complete = complete;

    let offset = yooLib.calculateAbsoluteOffset(td);
    let imgDiv = document.createElement('DIV');
    imgDiv.style.position = 'absolute';
    imgDiv.style.left = offset.left + 'px';
    imgDiv.style.top = offset.top + 'px';
    imgDiv.style.width = cfg.bitmapWidth + 'px';
    imgDiv.style.height = cfg.bitmapHeight + 'px';
    imgDiv.style.backgroundImage = td.innerDiv.style.backgroundImage;
    imgDiv.zIndex = 10;

    div.activePiece = td.innerDiv.style.backgroundImage;
    td.innerDiv.style.backgroundImage = '';
    div.appendChild(imgDiv);

    div.dragTd = td;
    div.dragDiv = imgDiv;
    div.dragLastX = e.clientX;
    div.dragLastY = e.clientY;
    yooLib.addHandler(div, 'mousemove', tdMouseMove);
};

var tdMouseMove = function(e) {
    yooLib.preventDefault(e);

    let node = yooLib.getTarget(e);
    for (;;) {
        node = yooLib.findParent(node, 'DIV');
        if (typeof(node) == 'undefined') return node;
        if (typeof(node.dragTd) != 'undefined') break;
        node = yooLib.parentNode(node);
    }

    let div = node;
    yooLib.move(div.dragDiv, e.clientX - div.dragLastX, e.clientY - div.dragLastY);
    div.dragLastX = e.clientX;
    div.dragLastY = e.clientY;
    return div;
};

initPublic(this);

}; // yooRusCheckers
