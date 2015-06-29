"use strict";

var tocca = require("tocca");
var Point2 = require("ndim/point2");
var faces = "♟♞♝♜♛♚♙♘♗♖♕♔";

module.exports = Board;
function Board() {
    this.grid = [];
    this.tiles = [];
    this.spaces = {};
    this.free = [];
    this.steps = 0;
    this.dimensions = new Point2(5, 5);
    var point = new Point2();
    for (var y = 0; y < this.dimensions.y; y++) {
        point.y = y;
        for (var x = 0; x < this.dimensions.x; x++) {
            point.x = x;
            this.grid.push(point.clone());
            this.spaces[point] = null;
            this.free.push(point.clone());
        }
    }
}

var offset = new Point2(10, 10);

Board.prototype.add = function add(component, id, scope) {
    var self = this;
    if (id === "this") {
        this.animator = scope.animator;
        window.addEventListener("keyup", this);
        window.document.body.addEventListener("touchstart", function (event) {
            event.preventDefault();
        });
        window.addEventListener("swipeup", function () {
            self.swipeUp();
        });
        window.addEventListener("swipedown", function () {
            self.swipeDown();
        });
        window.addEventListener("swipeleft", function () {
            self.swipeLeft();
        });
        window.addEventListener("swiperight", function () {
            self.swipeRight();
        });
        scope.components.grid.value = this.grid;
        scope.components.tiles.value = this.tiles;
        this.addRandomTile(0);
        this.addRandomTile(0);
    } else if (id === "tiles:iteration") {
        var tile = component.value;
        scope.components.label.value = faces.charAt(tile.value % faces.length);
        var element = scope.components.tile.actualNode;
        element.style.backgroundColor = 'hsl(' + (tile.value * 53 % 359) + ', 80%, 80%)';
        tile.element = element;
        tile.animator = scope.animator.add(tile);
        tile.go(tile.position);
    } else if (id === "grid:iteration") {
        var element = scope.components.tile.actualNode;
        var point = component.value.scale(110);
        element.style.top = point.x + 'px';
        element.style.left = point.y + 'px';

    }
};

Board.prototype.addRandomTile = function (value) {
    var space = this.takeRandomFreeSpace();
    if (space) {
        this.addTile(space, value);
    }
};

Board.prototype.takeRandomFreeSpace = function takeRandomFreeSpace() {
    var index = (this.free.length * Math.random()) | 0;
    var space = this.free[index];
    this.free.splice(index, 1);
    return space;
};

Board.prototype.addTile = function (position, value) {
    var tile = new Tile();
    tile.parent = this;
    tile.position = position.clone();
    tile.value = value;
    this.tiles.push(tile);
    tile.reveal();
    this.spaces[position] = tile;
};

var last = new Point2();
var point = new Point2();
Board.prototype.swipe = function (major, minor, start, step) {
    for (var i = 0; i < this.dimensions[major]; i++) {
        point[major] = i;
        var first, k = start;
        first = null;
        for (var j = 0; j < this.dimensions[minor]; j++) {
            point[minor] = step > 0 ? j : start - j;
            var second = this.spaces[point];
            if (second) {
                if (!first) { 
                    first = second;
                } else if (first.value === second.value) {
                    point[minor] = k;
                    k += step;
                    this.move(first, point);
                    this.move(second, point);
                    first.fade();
                    second.fade();
                    this.addTile(point, first.value + 1);
                    first = null;
                } else {
                    point[minor] = k;
                    k += step;
                    this.move(first, point);
                    first = second;
                }
            }
        }
        if (first) {
            point[minor] = k;
            k += step;
            this.move(first, point);
        }
    }
    this.addRandomTile(0);
    this.steps++;
};

Board.prototype.swipeUp = function swipeUp() {
    this.swipe('x', 'y', 0, 1);
};

Board.prototype.swipeLeft = function swipeUp() {
    this.swipe('y', 'x', 0, 1);
};

Board.prototype.swipeDown = function swipeUp() {
    this.swipe('x', 'y', this.dimensions.y - 1, -1);
};

Board.prototype.swipeRight = function swipeUp() {
    this.swipe('y', 'x', this.dimensions.x - 1, -1);
};

Board.prototype.move = function (tile, destination) {
    this.spaces[tile.position] = null;
    this.free.push(tile.position.clone());
    tile.move(destination);
    this.spaces[destination] = tile;
    for (var index = 0; index < this.free.length; index++) {
        if (this.free[index].equals(destination)) {
            this.free.splice(index, 1);
        }
    }
}

Board.prototype.handleEvent = function (event) {
    if (event.keyCode === 37 || event.keyCode === 72) {
        this.swipeLeft();
    } else if (event.keyCode === 38 || event.keyCode === 75) {
        this.swipeUp();
    } else if (event.keyCode === 39 || event.keyCode === 76) {
        this.swipeRight();
    } else if (event.keyCode === 40 || event.keyCode === 74) {
        this.swipeDown();
    }
};

function Tile() {
    this.parent = null;
    this.element = null;
    this.originalPosition = new Point2();
    this.position = new Point2();
    this.value = null;
    this.animator = null;
    this.scale = 0;
    this.originalScale = 0;
}

Tile.prototype.go = function go(position) {
    this.position.become(position);
    this.originalPosition.become(position);
    this.animator.requestRedraw();
};

Tile.prototype.move = function move(position) {
    this.originalPosition.become(this.position);
    this.position.become(position);
    this.animator.requestRedraw();
    this.animator.requestTransition();
};

Tile.prototype.fade = function fade() {
    this.originalScale = this.scale;
    this.scale = .5;
    this.animator.requestRedraw();
    this.animator.requestTransition();
    this.element.addEventListener("transitionend", this);
};

Tile.prototype.handleEvent = function handleEvent(event) {
    var index = this.parent.tiles.indexOf(this);
    if (index < 0) {
        // This is strange, but appears to work.
        // There might be duplicate transitionend events.
        return;
    }
    this.parent.tiles.splice(index, 1);
};

Tile.prototype.reveal = function reveal() {
    this.originalScale = this.scale;
    this.scale = 1;
    this.animator.requestRedraw();
    this.animator.requestTransition();
};

Tile.prototype.redraw = function redraw() {
    var position = this.originalPosition.scale(110).addThis(offset);
    this.element.style.transition = 'none';
    this.element.style.top = position.y + 'px';
    this.element.style.left = position.x + 'px';
    this.element.style.transform = 'scale(' + this.originalScale + ')';
    this.originalPosition.become(this.position);
    this.originalScale = this.scale;
};

Tile.prototype.transition = function draw() {
    var position = this.position.scale(110).addThis(offset);
    this.element.style.transition = 'all 200ms ease';
    this.element.style.transform = 'scale(' + this.scale + ')';
    this.element.style.top = position.y + 'px';
    this.element.style.left = position.x + 'px';
};
