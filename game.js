var onKeyDown = function(e) {
    var currentCell = { x: game.thisPlayer().x, y: game.thisPlayer().y };
    switch (e.keyCode) {
        // W or Up
        case 87:
        case 38:
            if (!game.mazeContents[currentCell.x][currentCell.y].top); {
                socket.emit('move', 'up');
            }
            e.preventDefault();
            break;
        //S or Down
        case 83:
        case 40:
            if (!game.mazeContents[currentCell.x][currentCell.y].bottom); {
                socket.emit('move', 'down');
            }
            e.preventDefault();
            break;
        // A or Left
        case 65:
        case 37:
            if (!game.mazeContents[currentCell.x][currentCell.y].left); {
                socket.emit('move', 'left');
            }
            e.preventDefault();
            break;
        //D or Right
        case 68:
        case 39:
            if (!game.mazeContents[currentCell.x][currentCell.y].right); { 
                socket.emit('move', 'right');
            }
            e.preventDefault();
            break;
    }
};

var Game = function(gameDetails) {
    this.mazeContents = gameDetails.maze;
    this.start = gameDetails.start;
    this.end = gameDetails.end;
    this.players = gameDetails.players;
    this.x = gameDetails.x;
    this.y = gameDetails.y;
    this.ctx = document.getElementById('bg').getContext('2d');
    var fg = document.getElementById('fg');
    this.ftx = fg.getContext('2d');
    this.drawBG();
    this.drawFG();
    fg.addEventListener('keydown', onKeyDown, true);
    this.playerListInit();
};

Game.prototype.playerListInit = function() {
    var playersToSort = [];
    for (var i in this.players) {
        playersToSort.push(this.players[i]);
        playersToSort.sort(function(a, b) { return b.score - a.score });
        for (var i = 0; i < playersToSort.length; i++) {
            addToPlayerList(playersToSort[i]);
        }
    }
}

Game.prototype.drawBG = function() {
    this.ctx.clearRect(0, 0, this.x * 10 + 1, this.y * 10 + 1);
    this.ctx.beginPath();
    for (var i = 0; i < this.x; i++) {

        for (var j = 0; j < this.y; j++) {
            this.ctx.beginPath();
            if(this.mazeContents[i][j].top) {
                this.ctx.moveTo(i * 10, j * 10);
                this.ctx.lineTo(i * 10 + 10, j * 10);
            }
            if(this.mazeContents[i][j].bottom) {
                this.ctx.moveTo(i * 10, j * 10 + 10);
                this.ctx.lineTo(i * 10 + 10, j * 10 + 10);
            }
            if(this.mazeContents[i][j].left) {
                this.ctx.moveTo(i * 10, j * 10);
                this.ctx.lineTo(i * 10, j * 10 + 10);
            }
            if(this.mazeContents[i][j].right) {
                this.ctx.moveTo(i * 10 + 10, j * 10);
                this.ctx.lineTo(i * 10 + 10, j * 10 + 10);
            }
            this.ctx.stroke();
        }
    }

    // Draw staring and ending locations
    this.ctx.beginPath();
    this.ctx.fillStyle = "green";
    this.ctx.arc(this.start.x * 10 + 5, this.start.y * 10 + 5, 3, 0, 2 * Math.PI, false);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.fillStyle = "red";
    this.ctx.arc(this.end.x * 10 + 5, this.end.y * 10 + 5, 3, 0, 2 * Math.PI, false);
    this.ctx.fill();
};

Game.prototype.drawFG = function() {
    this.ftx.clearRect(0, 0, fg.width, fg.height);
    for (var i in this.players) {
        this.ftx.fillStyle = this.players[i].color;
        this.ftx.fillRect(this.players[i].x * 10 + 1, this.players[i].y * 10 + 1, 8, 8);
    }
};

Game.prototype.addPlayer = function(player) {
    this.players[player.id] = player;
    this.drawFG();
};

Game.prototype.thisPlayer = function() {
    return this.players[socket.socket.sessionid];
}

var socket = io.connect('http://192.168.0.135:8080');

var game;

var enterGame = function() {
    socket.emit('joinGame', {name: document.nameEntry.pname.value});

    var form = document.getElementById("nameForm");
    form.parentNode.removeChild(form);
    
    $('body').append('<div id="chatBox"></div>');
    $('body').append('<input id="chatText" type="text">');
    $('#chatText').keyup(function(event) {
        if (event.keyCode === 13) {
            socket.emit('chat', $('#chatText').val());
            $('#chatText').val('');
        }
    });

    socket.on('win', function(data) {
        $('#chatBox').append('<p class="serverMessage">' + data + ' has won!');
        scrollChat();
    });

    socket.on('newMaze', function(data) {
        game = new Game(data);
    });

    socket.on('newLocation', function(data) {
        game.players[data.id].x = data.x;
        game.players[data.id].y = data.y;
        game.drawFG();

    });

    socket.on('newPlayer', function(data) {
        game.addPlayer(data);
        $('#chatBox').append('<p class="serverMessage">' + data.name + ' has joined!');
        scrollChat();
        addToPlayerList(data);
    });

    socket.on('leaveGame', function(id) {
        $('#' + id).remove();
        delete game.players[id];
    })

    socket.on('chat', function(data) {
        $('#chatBox').append('<p class="chatMessage"><span style="color:' + data.color +
                             '">' + data.player + ':</span> ' + data.message);
        scrollChat();
    });
};

var addToPlayerList = function (player) {
    $('#' + player.id).remove();
    var playerInfo = '<div class="playerEntry" id="' + player.id + '"></diav>';
    $('#playerList').append(playerInfo);
    $('#' + player.id).append('<div class="playerBox" style="background-color:' + player.color + '"></div>');
    $('#' + player.id).append('<p class="boxName">' + player.name + ' ' + player.score + '</p>');
};

var scrollChat = function() {
        var height = 0;
        $('#chatBox p').each(function() {
            height += parseInt($(this).height());
        });

        height += '';

        $('#chatBox').animate({scrollTop: height});
};