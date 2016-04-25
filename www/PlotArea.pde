class PlotArea
{
  int anchorX, anchorY;
  int wide, high;
  float xmin, xmax, ymin, ymax;
  PGraphics canvas;
  int coordinate;
  String xlabel, ylabel, title;
  int padding = 30;
  
  PlotArea(int AX, int AY, int W, int H, float xm, float XM, float ym, float YM){
    anchorX = AX;
    anchorY = AY;
    wide = W;
    high = H;
    float xpad = (XM-xm)/10;
    float ypad = (YM-ym)/10;
    xmin = xm - xpad;
    xmax = XM + xpad;
    ymin = ym - ypad;
    ymax = YM + ypad;
    clear();
  }
  
  void coord2pixel(float[] input){
    input[0] = padding + (wide-2*padding) * (input[0] - xmin) / (xmax-xmin);
    input[1] = padding + (high-2*padding) * (1 - (input[1] - ymin) / (ymax-ymin));
  }
  
  void point(float x, float y){
    float[] vec = new float[]{x,y};
    coord2pixel(vec);
    canvas.beginDraw();
    canvas.ellipse(vec[0],vec[1],5,5);
    canvas.endDraw();
  }
 
  void points(float[] x, float[] y){
    int N = Math.min(x.length, y.length);
    canvas.beginDraw();
    canvas.stroke(0,100);
    for(int i = 0; i < N; i++){
      float[] vec = new float[]{x[i],y[i]};
      coord2pixel(vec);
      canvas.point(vec[0],vec[1]);
    }
    canvas.endDraw();
  }

  void scatter(float[] x, float[] y, float size){
    int N = Math.min(x.length, y.length);
    canvas.beginDraw();
    for(int i = 0; i < N; i++){
      float[] vec = new float[]{x[i],y[i]};
      coord2pixel(vec);
      canvas.ellipse(vec[0],vec[1],size,size);
    }
    canvas.endDraw();
  }

  void scatter(float[] x, float[] y){
    scatter(x,y,5);
  }

  void lines(float[] y){
    float[] x = new float[y.length];
    for(int i = 0; i < x.length; i++) x[i] = i;
    lines(x,y);
  }

  void lines(float[] x, float[] y){
    stroke(0);
    if(x.length < 2 || y.length < 2){
      console.log("arrays are too short to draw lines");
      console.log(x);
      console.log(y);
      return;
    }
    canvas.beginDraw();
    int L = min(x.length, y.length);
    float[] u = new float[2];
    float[] v = new float[2];
    for(int i = 1; i < L; i++){
      u[0] = x[i-1];
      u[1] = y[i-1];
      v[0] = x[i];
      v[1] = y[i];
      coord2pixel(u);
      coord2pixel(v);
      canvas.line(u[0],u[1],v[0],v[1]);
    }
    canvas.endDraw();
  }

  void setXLabel(String s){ xlabel = s; }
  void setYLabel(String s){ ylabel = s; }
  void setTitle(String s){ title = s; }
  
  void clear(){
    canvas = createGraphics(wide,high);
    xlabel = "";
    ylabel = "";
    title = "A really long title with many words";
  }
  void draw(){
    drawAxes();
    image(canvas, anchorX, anchorY); 
  }
  void drawAxes(){
    float[] zeros = new float[]{0,0};
    float[] mins = new float[]{xmin,ymin};
    float[] maxs = new float[]{xmax,ymax};
    coord2pixel(zeros);
    coord2pixel(mins);
    coord2pixel(maxs);
    canvas.beginDraw();
    //canvas.background(200);
    canvas.fill(0,0);
    canvas.rect(padding,padding,width-1-2*padding,height-1-2*padding);
    canvas.fill(0);
    canvas.textSize(16);
    canvas.text("x",wide-padding-10,height-padding+15);
    canvas.text("y",padding-15,padding+10);
    canvas.text(title, width/2 - textWidth(title)/2, padding-5);
    canvas.endDraw();
  }
  
}

