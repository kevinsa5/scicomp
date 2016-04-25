PlotArea plot;

void setup(){
    doResize();
    stroke(0);
    fill(255);
}

void draw(){
    if(figure_update){
        background(255);
        figure_update = false;
        var x = plotinfo.x;
        var y = plotinfo.y;
        plot = new PlotArea(0,0,width,height,Math.min(...x),Math.max(...x),Math.min(...y),Math.max(...y));
        plot.scatter(x,y,10);
        plot.setTitle(plotinfo.title);
        plot.draw();
    }
}

// taken from https://shoffing.wordpress.com/2013/02/22/automatically-scaling-a-processing-js-sketch-to-fit-the-browser-window/
function doResize(){
    
    var setupHeight = Math.min($(document).height(), $(window).height());
    var setupWidth  = Math.min($(document).width(),  $(window).width());
    setupHeight -= 20;
    setupWidth -= 20;

    $('#figure').width(setupWidth);
    $('#figure').height(setupHeight);
    size(setupWidth, setupHeight);
    figure_update = true;
}
function windowResize(){
    setTimeout(doResize,100);
}
$(window).resize(windowResize);
