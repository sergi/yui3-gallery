Goya Canvas YUI module
======================

Goya is a module for YUI 3 that simplifies development on canvas by enabling
the user to draw on and animate independent layers, in a similar way than Flash does.

Every layer preserves most of canvas methods and behavior, and acts completely
independent of the other layers. A layer can have as many children as necessary,
that will be drawn and animated in the context of the parent.

Goya was heavily inspired and contains parts of [mojombo's primer](http://github.com/mojombo/primer) project.


Basics
==============
Include Goya script
-------------------

Create Goya parent object and pass a node to hook it on
along with the desired canvas size.

    var G = new Y.Goya("#container", 500, 500);

Create the first layer inside the canvas

    var square = new Y.Goya.Layer();

Draw inside the layer as you would do in canvas

    square.fillStyle = "#ff0000";
    square.fillRect(13, 13, 25, 25);

Append the layer as a child of the main Goya object

    G.appendChild(square);

Add event listeners
-------------------

You can add YUI event listeners to the layer if you need to

    square.on("mouseover", function() {
        square.fillStyle = "#00ff00";
        square.fillRect(13, 13, 25, 25);
    });
    square.on("mouseout", function() {
        square.fillStyle = "#ff0000";
        square.fillRect(13, 13, 25, 25);
    });
    square.on("click", function() {
        alert("You clicked the red square!!");
    });

Creating hierarchies
--------------------

    // Create a second layer
    var roundedRect = new Y.Goya.Layer();
    roundedRect.fillStyle = "#0000ff";
    roundedRect.setXY([200, 200]);
    roundedRect.moveCenterTo(45, 10); // Set rotation center
    roundedRect.fillRoundedRect(0, 0, 90, 20, 10);
    G.appendChild(roundedRect);

    // ...and text layer inside the second layer
    var text1 = new Y.Goya.Layer();
    text1.setXY([5, 5]);
    text1.font = "14px Monaco";
    text1.fillStyle = "#FFFFFF";
    text1.fillText("Click me!", 0, 10);
    roundedRect.appendChild(text1);

Animation
---------

It is possible (and recommended) to use YUI Anim to animate Goya layers:

    // Create a text layer
    var text = new Y.Goya.Layer();
    text.setXY([50, 100]);
    text.font = "14px Arial";
    text.fillStyle = "#00AA00";
    text.fillText("Hello, World!", 0, 20);
    G.appendChild(text);

Create the animation object. We can use almost every feature of YUI Anim,
such as easing:

    var textAnim = new Y.Anim({
        node: text,
        from: { angle: -30 },
        to: { angle: 30 },
        duration: 1,
        easing: Y.Easing.easeOut,
        iterations: 'infinite',
        direction: 'alternate'
    });
    textAnim.run();

More animation examples
-----------------------
Create an infinite animation that moves the first square back and forth 100 px

    var squareAnim = new Y.Anim({
        node: square,
        to: {
            x: 100,
            y: 50
        },
        duration: 2,
        iterations: 'infinite',
        direction: 'alternate'
    });
    squareAnim.run();


Create an eased animation along a curved path when the rectagle is clicked.

    var randomCurve = function(end) {
        var points = [],
            n = 3,
            winWidth = 100,
            winHeight = 100;

        for (var i = 0; i < n; ++i) {
            points.push([
                Math.floor(Math.random() * winWidth),
                Math.floor(Math.random() * winHeight)
            ]);
        }

        if (end) { points.push(end); }
        return points;
    };

    var roundedRectAnim = new Y.Anim({
            node: roundedRect,
            duration: 3,
            easing: Y.Easing.elasticOut
    });

    roundedRect.on("click", function(e) {
        roundedRectAnim.set('to', {
            curve: randomCurve([230, 150]), // Make it follow a random path
            angle: parseInt(Math.random()*360) // We want to end up with the layer rotated to a random angle
        });
        roundedRectAnim.run();
    });

