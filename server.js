var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , maze = require('./maze.js');

app.listen(8080);

var Game = function(x, y) {
    this.x = x || 50;
    this.y = y || 50;

    this.players = {};
    this.newMaze(x, y);
    this.newLocations();
};

Game.prototype.newMaze = function() {
    var gameMaze = new maze.Maze(this.x, this.y);
    this.mazeContents = gameMaze.pretty();
    this.newLocations();
};

Game.prototype.newLocations = function() {
    this.startingLocation = { x: Math.floor(Math.random() * this.x),
                              y: Math.floor(Math.random() * this.y) };
    this.endingLocation = { x: Math.floor(Math.random() * this.x),
                            y: Math.floor(Math.random() * this.y) };
};

Game.prototype.addPlayer = function(player) {
    this.players[player.id] = player;
}

Game.prototype.checkWin = function(player) {
    if (player.x === this.endingLocation.x && player.y === this.endingLocation.y) {
        io.sockets.emit('win', player.name);
        this.newMaze();
        this.resetPlayers();
        io.sockets.emit('newMaze', {maze: game.mazeContents, start: game.startingLocation,
                                                      end: game.endingLocation, players: game.players,
                                                      x: game.x, y: game.y});
    }
}

Game.prototype.resetPlayers = function() {
    for (var i in this.players) {
        this.players[i].x = this.startingLocation.x;
        this.players[i].y = this.startingLocation.y;
    }
}

var randomColor = function() {
    var red = Math.floor(Math.random() * 256);
    var blue = Math.floor(Math.random() * 256);
    var green = Math.floor(Math.random() * 256);
    var color = 'rgb(' + red + ',' + blue + ',' + green + ')';

    return color;
}

var Player = function(name, id) {
    this.name = name;
    this.id = id;
    this.color = randomColor();
    this.x = game.startingLocation.x;
    this.y = game.startingLocation.y;
}

Player.prototype.move = function(direction) {
    var thisCell = game.mazeContents[this.x][this.y];
    var moved = false;
    switch (direction) {
        case 'up':
            if (!thisCell.top) {
                this.y--;
                moved = true;
            }
            break;
        case 'down':
            if (!thisCell.bottom) {
                this.y++;
                moved = true;
            }
            break;
        case 'left':
            if (!thisCell.left) {
                this.x--;
                moved = true;
            }
            break;
        case 'right':
            if (!thisCell.right) {
                this.x++;
                moved = true;
            }
            break;
    }

    if (moved) {
        io.sockets.emit('newLocation', {id: this.id, x: this.x, y: this.y});
        game.checkWin(this);
    }
}

var game = new Game(50, 50);

function handler (req, res) {
  fs.readFile(__dirname + req.url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

io.sockets.on('connection', function (socket) {
  socket.on('joinGame', function(data) {
    var name = data.name || 'player';
    var player = new Player(name, socket.id);
    game.addPlayer(player);
    socket.broadcast.emit('newPlayer', player);
    io.sockets.socket(socket.id).emit('newMaze', {maze: game.mazeContents, start: game.startingLocation,
                                                  end: game.endingLocation, players: game.players,
                                                  x: game.x, y: game.y});
  });

  socket.on('move', function(data) {
    var player = game.players[socket.id];
    player.move(data);
  });

  socket.on('chat', function(data) {
    io.sockets.emit('chat', {player: game.players[socket.id].name, message: data});
  });

  socket.on('disconnect', function() {
    delete game.players[socket.id];
  });
});
