var yooRusCheckersLogic = new function() {

var initPublic = function(obj) {
    obj.parseFen = parseFen;
    obj.generateMoves = generateMoves;
};

var squareToIndex = function(square) {
    square = square.trim();
    if (square.length != 2) {
        console.log('Wrong square ' + square);
        return -1;
    }
    let fileCh = square.charAt(0);
    let rankCh = square.charAt(1);

    if (fileCh < 'a' || fileCh > 'h') {
        console.log('Wrong square ' + square);
        return -1;
    }

    if (rankCh < '1' || rankCh > '8') {
        console.log('Wrong square ' + square);
        return -1;
    }

    let file = fileCh.charCodeAt(0) - 'a'.charCodeAt(0);
    let rank = rankCh.charCodeAt(0) - '1'.charCodeAt(0);
    return file + 16 * rank;
};

var isWhite = function(index) {
    if (index < 0) return false;
    let file = index & 0x0F;
    let rank = index >> 4;
    return (file ^ rank) & 1;
}

var isBlack = function(index) {
    if (index < 0) return false;
    return !isWhite(index);
};

var parseFen = function(fen) {

    let fenIndex = 0;
    function skipSpaces() {
        for (;;) {
            ch = fen.charAt(fenIndex++);
            if (ch != ' ') return ch;
        }
    }

    let retValue = new Object();
    retValue.board = [];

    ch = skipSpaces();
    switch (ch) {
        case 'W':
            retValue.active = 'WHITE';
            break;
        case 'B':
            retValue.active = 'BLACK';
            break;
        default:
            return 'Parse FEN error: Invalid active side, only W or B is supported.';
    }

    ch = skipSpaces();
    if (ch != ':') {
        return 'Parse FEN error: Colon after active side expected.';
    }

    ch = skipSpaces();
    if (fenIndex < 0) {
        return 'Piece color is expected, but EOL was found.';
    }

    let filled = [];
    filled['WHITE'] = 0;
    filled['BLACK'] = 0;

    for (;;) {

        switch (ch) {
            case 'W':
                current = 'WHITE';
                break;
            case 'B':
                current = 'BLACK';
                break;
            default:
                return 'Invalid piece color only W or B is supported.';
        }

        if (filled[current] != 0) {
            return 'Piece color used twice.';
        }
        filled[current] = 1;

        for (;;) {
            let piece = current == 'WHITE' ? 'w' : 'b';

            let square = function() {
                let ch = skipSpaces();
                if (ch =='K') {
                    piece = piece == 'w' ? 'W' : 'B';
                    return skipSpaces() + skipSpaces();
                } else {
                    return ch + skipSpaces();
                }
            }();

            let index = squareToIndex(square);
            if (!isBlack(index)) {
                return 'Black square string expected';
            }

            retValue.board[index] = piece;
            ch = skipSpaces();
            if (ch != ',') {
                break;
            }
        }

        if (filled['WHITE'] == 1 && filled['BLACK'] == 1) {
            break;
        }

        if (ch != ':') {
            return 'Colon expected.';
        }
        ch = skipSpaces();
    }

    ch = skipSpaces();
    if (fenIndex < fen.length) {
        return 'Some garbarge after valid FEN';
    }

    return retValue;
};

var generateMoves = function(position) {
    console.log('Not implemented');
    return [];
};

initPublic(this);

}; // yooRusCheckersLogic
