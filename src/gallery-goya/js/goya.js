YUI.add('goya', function(Y) {
var Goya = function(container, width, height) {
    this.container = Y.one(container);
    this.width = width;
    this.height = height;
    this.create();
};

Goya.prototype = {
    create: function() {
        var canvas = Y.Node.create('<canvas/>').setAttrs({
            "width":  this.width,
            "height": this.height
        }).setStyles({
            "z-index": 1,
            "padding": 0,
            "margin": 0
        });

        this.context = canvas._node.getContext('2d');
        this.root = new Goya.Layer();
        this.root.set("parent", {
                goya: this,
                x: 0,
                y: 0,
                globalX: 0,
                globalY: 0
        });

        canvas.on('mousemove', function(e) {
            var bounds = e.currentTarget._node.getBoundingClientRect();
            e.localX = e.clientX - bounds.left;
            e.localY = e.clientY - bounds.top;
            this.root.draw(e);
        }, this);

        Y.one(this.container).append(canvas);
    },

    appendChild: function(child) {
        child.set("parent", this);
        this.root.appendChild(child);
        this.draw();
    },

    removeChild: function(child) {
        this.root.removeChild(child);
        this.draw();
    },

    draw: function() {
        this.context.clearRect(0, 0, this.width, this.height);
        this.root.draw();
    }
};

Goya.Layer = function(config) {
    Goya.Layer.superclass.constructor.call(this, config);

    this.children = [];
    this.calls = [];
    this._rotation = 0;
    this._centerX = 0;
    this._centerY = 0;
    this._mouseWithin = false;

    this._methods = [
      "beginPath",
      "closePath",
      "moveTo",
      "lineTo",
      "quadraticCurveTo",
      "bezierCurveTo",
      "arc",
      "fill",
      "stroke",
      "fillRect",
      "fillText",
      "drawImage",
      "translate",
      "rotate",
      "save",
      "restore"
    ];

    this._setters = [
        "fillStyle",
        "strokeStyle",
        "textAlign",
        "font"
    ];
    this.ghostables = [
        "fill",
        "fillRect",
        "drawImage"
    ];

    var _methods = this._methods;
    var _setters = this._setters;
    var self = this;
    for (var m=0, ml=_methods.length; m < ml; m++) {
        (function (a) {
            if (!self[a]) {
                self[a] = function() {
                    var params = [a];
                    if (arguments.length) {
                        params.push.apply(params, Array.prototype.slice.call(arguments));
                    }
                    self.calls.push(params);
                };
            }
        })(_methods[m]);
    }
    for (var s=0, sl=_setters.length; s < sl; s++) {
        (function (a) {
            self.__defineSetter__(a, function(p) {
                self.calls.push([a, p]);
            });
        })(_setters[s]);
    }
};

Goya.Layer.NAME = "goya";
Goya.Layer.ATTRS = {
    parent: {
        setter: function(val) {
            this.goya = val.goya;
            Y.each(this.children, function(child) { child.set("parent", this); }, this);
        }
    },
    context: {
        getter: function() {
            if (this.goya) {
                return this.goya.context;
            }
        }
    },
    angle: {
        value: 0,
        setter: function(val) {
            val = val % 360;
            if (this._rotation == val) { return val; }
            this._nextRotation = (val - this._rotation) * Math.PI/180;
            return val;
        }
    },
    globalX: {
        readOnly: true,
        getter: function() {
            return this._x + this.parent.globalX;
        }
    },
    globalY: {
        readOnly: true,
        getter: function() {
            return this._y + this.parent.globalY;
        }
    },
    x: { value: 0 },
    y: { value: 0 },
    _mouseWithin: { value: false },
    visible: { value: true }
};

Y.extend(Goya.Layer, Y.Base, {
    initializer: function(config) {
        this.on("angleChange", this._redraw);
        this.on("_mouseWithinChange", function(e) {
            if (e.prevVal !== e.newVal) {
                this.fire(e.newVal === true ? "mouseover" : "mouseout");
            }
        }, this);

        this.after("xChange", this._redraw);
        this.after("yChange", this._redraw);
        this.after("visibleChange", this._redraw);
    },
    appendChild: function(child) {
        child.set("parent", this);
        this.children.push(child);
        if (this.goya) { this.goya.draw(); }
    },
    removeChild: function(child) {
        var index = this.children.indexOf(child);
        if (index != -1) {
            delete this.children[index];
        }
    },
    moveCenterTo: function(x, y) {
        this._centerX = x;
        this._centerY = y;
    },
    getX: function(x) { return this.get("x"); },
    getY: function(y) { return this.get("y"); },
    getXY: function(xy) {
        return [this.get("x"), this.get("y")];
    },
    setX: function(x) { this.set("x", x); },
    setY: function(y) { this.set("y", y); },
    setXY: function(xy) {
        this.set("x", xy[0]);
        this.set("y", xy[1]);
    },

    /* Shapes */
    rect: function(x, y, w, h) {
        this.beginPath();
        this.moveTo(x, y);
        this.lineTo(x + w, y);
        this.lineTo(x + w, y + h);
        this.lineTo(x, y + h);
        this.lineTo(x, y);
    },
    fillRect: function(x, y, w, h) {
        this.rect(x - this._centerX, y - this._centerY, w, h);
        this.fill();
    },
    roundedRect: function(x, y, w, h, rad) {
        this.beginPath();
        this.moveTo(x, y + rad);
        this.lineTo(x, y + h - rad);
        this.quadraticCurveTo(x, y + h, x + rad, y + h);
        this.lineTo(x + w - rad, y + h);
        this.quadraticCurveTo(x + w, y + h, x + w, y + h - rad);
        this.lineTo(x + w, y + rad);
        this.quadraticCurveTo(x + w, y, x + w - rad, y);
        this.lineTo(x + rad, y);
        this.quadraticCurveTo(x, y, x, y + rad);
    },
    fillRoundedRect: function(x, y, w, h, rad) {
        this.roundedRect(x, y, w, h, rad);
        this.fill();
    },
    ellipse:function(aX, aY, aWidth, aHeight){
        var hB = (aWidth / 2) * 0.5522848,
        vB = (aHeight / 2) * 0.5522848,
        eX = aX + aWidth,
        eY = aY + aHeight,
        mX = aX + aWidth / 2,
        mY = aY + aHeight / 2;
        this.beginPath();
        this.moveTo(aX, mY);
        this.bezierCurveTo(aX, mY - vB, mX - hB, aY, mX, aY);
        this.bezierCurveTo(mX + hB, aY, eX, mY - vB, eX, mY);
        this.bezierCurveTo(eX, mY + vB, mX + hB, eY, mX, eY);
        this.bezierCurveTo(mX - hB, eY, aX, mY + vB, aX, mY);
    },

    _detectMouse: function(e) {
        var testX = e.localX;
        var testY = e.localY;
        if (!Y.UA.webkit) {
            testX -= this.get("x");
            testY -= this.get("y");
        }
        this.set("_mouseWithin", this.get("context").isPointInPath(testX, testY));
    },

    _drawChildren: function(e) {
        Y.each(this.children, function(child) {
            if (e && !Y.UA.webkit) {
                e.localX -= this.get("x");
                e.localY -= this.get("y");
            }
            child.draw(e || null);
        }, this);
    },

    _redraw: function(e) {
        if (this.goya) { this.goya.draw(); }
        e.stopImmediatePropagation();
    },

    draw: function(e) {
        if (!this.get("visible")) { return; }

        var ctx = this.get("context");
        var calls = this.calls;
        var methods = this._methods;
        var setters = this._setters;

        ctx.save();
        ctx.translate(this.get("x"), this.get("y"));
        if (this._nextRotation) {
            ctx.rotate(this._nextRotation);
        }

        // Execute methods or setters in the |calls| queue
        for (var i=0, l=calls.length; i<l; i++) {
            var call = calls[i];
            var action = call[0];

            if (methods.indexOf(action) != -1) {
                ctx[action].apply(ctx, call.slice(1, call.length));
                if (e && this.ghostables.indexOf(action) != -1) {
                    this._detectMouse(e);
                }
            } else if (setters.indexOf(action) != -1) { // it must be a setter
                ctx[action] = call[1];
            }
            else { throw "Unrecognized method/setter invoked"; }
        }
        this._drawChildren(e || null);
        ctx.restore();
    }
});

Y.Goya = Goya;

Y.Anim.ATTRS.node = {
    setter: function(node) {
        if (!(node instanceof Goya.Layer)) {
            node = Y.one(node);
        }
        this._node = node;
        if (!node) {
            Y.log(node + ' is not a valid node', 'warn', 'Anim');
        }
        return node;
    }
};

Y.Anim.DEFAULT_SETTER = function(anim, att, from, to, elapsed, duration, fn, unit) {
    unit = unit || '';
    var NUM = Number;
    if (anim._node instanceof Goya.Layer) {
        anim._node.set(att, fn(elapsed, NUM(from), NUM(to) - NUM(from), duration));
    } else {
        anim._node.setStyle(att, fn(elapsed, NUM(from), NUM(to) - NUM(from), duration) + unit);
    }
};

Y.Anim.DEFAULT_GETTER = function(anim, prop) {
    return anim._node instanceof Goya.Layer ? anim._node.get(prop) : anim._node.getComputedStyle(prop);
};

}, '1.0', { requires:['base', 'node', 'dom', 'anim'] });
