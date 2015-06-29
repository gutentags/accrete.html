"use strict";

var Document = require("gutentag/document");
var Scope = require("gutentag/scope");
var Main = require("./main.html");
var Animator = require("blick");

var scope = new Scope();
scope.animator = new Animator();
var document = new Document(window.document.body);
var main = new Main(document.documentElement, scope);
