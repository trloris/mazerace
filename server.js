var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
  , sanitizer = require('sanitizer')
  , maze = require('./maze.js');

app.listen(8080);

io.enable('broset client minification');
io.enable('browser client etag');
io.enable('broser client gzip');

io.set('close timeout', 15);

var Game = function(x, y) {
    this.x = x || 50;
    this.y = y || 50;

    this.players = {};
    this.newMaze(x, y);
    this.newLocations();
};

// Create game's maze
Game.prototype.newMaze = function() {
    var gameMaze = new maze.Maze(this.x, this.y);
    this.mazeContents = gameMaze.pretty();
    this.newLocations();
};

// Create an ending and starting location for game
Game.prototype.newLocations = function() {
    this.startingLocation = { x: Math.floor(Math.random() * this.x),
                              y: Math.floor(Math.random() * this.y) };
    this.endingLocation = { x: Math.floor(Math.random() * this.x),
                            y: Math.floor(Math.random() * this.y) };
};

// Add a new player to player collection
Game.prototype.addPlayer = function(player) {
    this.players[player.id] = player;
};

// Check if a player is at ending location
Game.prototype.checkWin = function(player) {
    if (player.x === this.endingLocation.x && player.y === this.endingLocation.y) {
        player.score++;
        io.sockets.emit('win', player.name);
        this.newMaze();
        this.resetPlayers();
        io.sockets.emit('newMaze', {maze: game.mazeContents, start: game.startingLocation,
                                                      end: game.endingLocation, players: game.players,
                                                      x: game.x, y: game.y});
    }
};

// After a game is won, move all players to starting location
Game.prototype.resetPlayers = function() {
    for (var i in this.players) {
        this.players[i].x = this.startingLocation.x;
        this.players[i].y = this.startingLocation.y;
    }
};

// Create a random color of the format rgba(RRR,BBB,GGG).
// Will be used for player's in game icon color.
var randomColor = function() {
    var red = Math.floor(Math.random() * 256);
    var blue = Math.floor(Math.random() * 256);
    var green = Math.floor(Math.random() * 256);
    var color = 'rgb(' + red + ',' + blue + ',' + green + ')';

    return color;
};

var Player = function(name, id) {
    this.name = name;
    this.id = id;
    this.color = randomColor();
    this.x = game.startingLocation.x;
    this.y = game.startingLocation.y;
    this.score = 0;
};

// Check if move is valid. If so, emit a signal to all players of the player's new location.
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
};

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
};

io.sockets.on('connection', function (socket) {
    socket.on('joinGame', function(data) {
    // Make sure player hasn't already joined.
        if (typeof game.players[socket.id] === 'undefined') {
            var name = data.name || 'player';
            var shortName = name.substring(0, 20);
            var safeName = sanitizer.escape(shortName);
            var player = new Player(safeName, socket.id);
            game.addPlayer(player);
            socket.broadcast.emit('newPlayer', player);
            io.sockets.socket(socket.id).emit('newMaze', {maze: game.mazeContents, start: game.startingLocation,
                                                          end: game.endingLocation, players: game.players,
                                                          x: game.x, y: game.y});
        }
    });

  socket.on('move', function(data) {
    try {
        var player = game.players[socket.id];
        player.move(data);
    }
    catch (e) {
        console.log(e);
    }
  });

  socket.on('chat', function(data) {
    try {
        player = game.players[socket.id];
        var timeStamp = new Date();
        var now = timeStamp.getTime();
        var lastChatTime = player.lastChatTime || 0;
        var timeStamp = new Date();
        var now = timeStamp.getTime();
        if (now - lastChatTime < 1000) {
            socket.emit('chat', {player: 'some jerk face', message: 'quiet down'});
        } else {
            var shortMessage = data.substring(0, 200);
            var safeMessage = sanitizer.escape(shortMessage);
            io.sockets.emit('chat', {player: player.name, color: player.color, message: safeMessage});
        }
        player.lastChatTime = now;
    } catch (e) {
        console.log(e);
    }
  });

  socket.on('disconnect', function() {
    try {
        io.sockets.emit('leaveGame', socket.id);
        delete game.players[socket.id];
    } catch (e) {
        console.log(e);
    }
  });
});
