var yooRusCheckersLogic = new function() {

var initPublic = function(obj) {
    obj.parseFen = parseFen;
    obj.buildFen = buildFen;
    obj.generateMoves = generateMoves;
    obj.doMove = doMove;
    obj.indexToSquare = indexToSquare;
    obj.squareToIndex = squareToIndex;
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

var getSquare = function(file, rank) {
    return "abcdefgh".charAt(file) + "12345678".charAt(rank);
};

var indexToSquare = function(index) {
    let file = index & 0x0F;
    let rank = (index & 0xF0) >> 4;
    return getSquare(file, rank);
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
    let simResult = [];
    let takeResult = [];

    function appendMoves(destination, moves, separator) {
        moves.forEach(
            function (move) {
                var squares = move.map(indexToSquare);
                destination.push(squares.join(separator));
            }
        );
    }

    for (let rank=0; rank<8; ++rank)
    for (let file=0; file<8; ++file) {
        if ((rank ^ file) & 1) {
            continue;
        }

        let index = file + 16*rank;
        let piece = position.board[index];
        if (typeof(piece) != 'string') {
            continue;
        }

        let isActiveWhite = position.active == 'WHITE';
        let isPieceWhite = piece == 'w' || piece == 'W';
        if (isActiveWhite ^ isPieceWhite) {
            continue;
        }

        if (piece == 'w' || piece == 'b') {
            let simMoves = moveSimple(position, index);
            appendMoves(simResult, simMoves, '-');
            let takeMoves = takeSimple(position, index);
            appendMoves(takeResult, takeMoves, ':');
        }

        if (piece == 'W' || piece == 'B') {
            let simMoves = moveMam(position, index);
            appendMoves(simResult, simMoves, '-');
            let takeMoves = takeMam(position, index);
            appendMoves(takeResult, takeMoves, ':');
        }
    }

    return takeResult.length > 0 ? takeResult : simResult;
};

var buildFen = function(position) {
    let parts = [];
    if (position.active == 'WHITE') {
        parts.push('W');
    }
    if (position.active == 'BLACK') {
        parts.push('B');
    }
    if (parts.length != 1) {
        throw 'Invalid position object, wrong active value';
    }

    let white = [];
    let black = [];
    position.board.forEach(
        function (value, index) {
            let square = indexToSquare(index);
            switch (value) {
                case 'W': white.push('K' + square); break;
                case 'w': white.push(square); break;
                case 'B': black.push('K' + square); break;
                case 'b': black.push(square); break;
            }
        }
    );

    parts.push('W' + white.join(','));
    parts.push('B' + black.join(','));
    return parts.join(':');
};

var isPromotion = function(active, index) {
    if (active == 'WHITE') {
        return index >= 7*16;
    } else {
        return index < 16;
    }
};

var newTry = function(index, delta) {
    let result = new Object();
    result.index = index;
    result.delta = delta;
    return result;
};

var newMurder = function(start, index, delta) {
    let result = new Object();
    result.start = start;
    result.index = index;
    result.delta = delta;
    result.next = index + delta;
    return result;
};

var addKilled = function(killed, corpse) {
    let result = killed.slice(0);
    result[corpse] = 1;
    return result;
};

var getOrthogonal = function(delta) {
    if (delta == 15 || delta == -15) return 17;
    if (delta == 17 || delta == -17) return 15;
    throw 'Assertion fails!';
};

var moveSimple = function(position, oldIndex) {
    let result = [];
    let sign = position.active == 'WHITE' ? +1 : -1;
    [15, 17].forEach(
        function (delta) {
            let newIndex = oldIndex + sign * delta;
            if (newIndex & 0x88) return;
            let square = position.board[newIndex];
            if (typeof(square) == 'string') return;
            result.push([oldIndex, newIndex]);
        }
    );
    return result;
};

var moveMam = function(position, oldIndex) {
    let result = [];
    [-17, -15, 15, 17].forEach(
        function (delta) {
            let newIndex = oldIndex;
            for (;;) {
                newIndex += delta;
                if (newIndex & 0x88) return;
                let square = position.board[newIndex];
                if (typeof(square) == 'string') return;
                result.push([oldIndex, newIndex]);
            }
        }
    );
    return result;
};

var takeSimple = function(position, index) {
    let saved = position.board[index];
    delete position.board[index];

    let result = [];
    [-17, -15, 15, 17].forEach(
        function (delta) {
            let enemy = trySimTake(position, index, delta, []);
            if (enemy == -1) return;
            let next = enemy + delta;

            let killed = [];
            killed[enemy] = 1;
            if (isPromotion(position.active, next)) {
                recursiveMamTake(position, next, delta, killed).forEach(
                    function (move) {
                        return result.push([index].concat(move))
                    }
                );
            } else {
                recursiveSimTake(position, next, delta, killed).forEach(
                    function (move) {
                        return result.push([index].concat(move))
                    }
                );
            }
        }
    );

    position.board[index] = saved;
    return result;
};


var trySimTake = function(position, index, delta, killed) {
    let me1 = position.active == 'WHITE' ? 'W' : 'B';
    let me2 = position.active == 'WHITE' ? 'w' : 'b';

    let enemy = index + delta;
    let next = enemy + delta;

    if (next & 0x88) return -1;
    if (typeof(position.board[enemy]) == 'undefined') return -1;
    if (typeof(position.board[next]) != 'undefined') return -1;
    if (typeof(killed[enemy]) != 'undefined') return -1;

    let square = position.board[enemy];
    if (square == me1 || square == me2) return -1;

    return enemy;
};

var recursiveSimTake = function(position, index, delta, killed) {
    let tryList = [];
    [-17, -15, 15, 17].forEach(
        function (nextDelta) {
            if (nextDelta != -delta) {
                tryList.push(newTry(index, nextDelta));
            }
        }
    );

    let murderList = [];
    tryList.forEach(
        function (takeTry) {
            var enemy = trySimTake(position, takeTry.index, takeTry.delta, killed);
            if (enemy < 0) return;
            murderList.push(newMurder(takeTry.index, enemy, takeTry.delta));
        }
    );

    if (murderList.length == 0) {
        return [[index]];
    }

    let result = [];
    murderList.forEach(
        function (murder) {
            let newKilled = addKilled(killed, murder.index);
            if (isPromotion(position.active, murder.next)) {
                recursiveMamTake(position, murder.next, murder.delta, newKilled).forEach(
                    function (move) {
                        result.push([murder.start].concat(move));
                    }
                );
            } else {
                recursiveSimTake(position, murder.next, murder.delta, newKilled).forEach(
                    function (move) {
                        result.push([murder.start].concat(move));
                    }
                );
            }
        }
    );

    return result;
};

var takeMam = function(position, index) {
    let saved = position.board[index];
    delete position.board[index];

    let result = [];
    [-17, -15, 15, 17].forEach(
        function (delta) {
            let enemy = tryMamTake(position, index + delta, delta, []);
            if (enemy == -1) return;
            let next = enemy + delta;

            let killed = [];
            killed[enemy] = 1;
            recursiveMamTake(position, next, delta, killed).forEach(
                function (move) {
                    return result.push([index].concat(move))
                }
            );
        }
    );

    position.board[index] = saved;
    return result;
};

var tryMamTake = function(position, index, delta, killed) {
    let me1 = position.active == 'WHITE' ? 'W' : 'B';
    let me2 = position.active == 'WHITE' ? 'w' : 'b';

    for (;;) {
        if (index & 0x88) return -1;
        if (typeof(killed[index]) != 'undefined') return -1;
        let square = position.board[index];
        if (typeof(square) == 'string') break;
        index += delta;
    }

    let square = position.board[index];
    if (square == me1 || square == me2) return -1

    let next = index + delta;
    if (next & 0x88) return -1;
    if (killed[next]) return -1;
    let nextSquare = position.board[next];
    if (typeof(nextSquare) == 'string') return -1;

    return index;
};

var recursiveMamTake = function(position, index, delta, killed) {
    let result = [];

    let tryList = [newTry(index, delta)];
    let orthogonal = getOrthogonal(delta);

    for (;;) {
        if (index & 0x88) break;
        let square = position.board[index];
        if (typeof(square) == 'string') break;
        result.push([index]);
        tryList.push(newTry(index, +orthogonal))
        tryList.push(newTry(index, -orthogonal))
        index += delta;
    }

    let murderList = [];
    tryList.forEach(
        function (takeTry) {
            let enemy = tryMamTake(position, takeTry.index, takeTry.delta, killed);
            if (enemy < 0) return;
            murderList.push(newMurder(takeTry.index, enemy, takeTry.delta));
        }
    );

    if (murderList.length == 0) {
        return result;
    }

    result = [];
    murderList.forEach(
        function (murder) {
            let newKilled = addKilled(killed, murder.index);
            recursiveMamTake(position, murder.next, murder.delta, newKilled).forEach(
                function (move) {
                    result.push([murder.start].concat(move));
                }
            );
        }
    );

    return result;
};

var doMove = function(position, move) {
    if (typeof(move) != 'string') return;
    let sim = move.split('-');
    if (sim.length > 1) {
        return doSimMove(position, sim);
    }
    let take = move.split(':');
    if (take.length > 1) {
        return doTakeMove(position, take);
    }
    throw 'Wrong move ' + move;
};

var doSimMove = function(position, sim) {
    let indexes = sim.map(squareToIndex);
    if (indexes.length != 2) {
        throw 'Wrong simple move length';
    }

    let from = indexes[0];
    let to = indexes[1];
    let piece = position.board[from];
    if (isPromotion(position.active, to)) {
        piece = piece.toUpperCase(piece);
    }

    let result = Object.assign({}, position);
    delete result.board[from];
    result.board[to] = piece;
    result.active = position.active == 'WHITE' ? 'BLACK' : 'WHITE';
    return result;
};

var getDelta = function(index1, index2) {
    let delta = index2 - index1;
    let sign = delta < 0 ? -1 : +1;
    delta *= sign;
    if (delta % 15 == 0) return sign * 15;
    if (delta % 17 == 0) return sign * 17;
    return 0;
};

var doTakeMove = function(position, take) {
    let indexes = take.map(squareToIndex);
    let from = indexes[0];
    let to = indexes.slice(-1)[0];

    let wasPromotion = false;
    indexes.forEach(
        function (index) {
            if (isPromotion(position.active, index)) {
                wasPromotion = true;
            }
        }
    );

    let piece = position.board[from];
    if (wasPromotion) {
        piece = piece.toUpperCase(piece);
    }

    let result = Object.assign({}, position);
    delete result.board[from];

    for (let i=0; i < indexes.length - 1; ++i) {
        let i1 = indexes[i];
        let i2 = indexes[i+1];
        let delta = getDelta(indexes[i], indexes[i+1]);
        for (let j=i1+delta; j!=i2; j+=delta) {
            delete result.board[j];
        }
    }

    result.board[to] = piece;
    result.active = position.active == 'WHITE' ? 'BLACK' : 'WHITE';
    return result;
};

initPublic(this);

}; // yooRusCheckersLogic
