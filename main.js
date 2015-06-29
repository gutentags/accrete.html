"use strict";

var O = require("pop-observe");

module.exports = Main;
function Main() {
}

Main.prototype.add = function add(component, id, scope) {
    if (id === "this") {
        var board = scope.components.board;
        O.observePropertyChange(board, "steps", this);
        this.stepsText = scope.components.steps;
        this.stepsText.value = 0;
    }
}

Main.prototype.handleStepsPropertyChange = function (value) {
    this.stepsText.value = value;
};
