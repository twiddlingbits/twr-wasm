#include <stddef.h>
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "canvas.h"

int testMode=false;

#define ID_DARKBITMAP 1  // any unique long will do
#define ID_WHITEBITMAP 2
#define ID_GRADIENT 3

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define PI 3.14159265359
#define MIN_BALL_RADIUS 10
#define MAX_NUM_RADII 25

class Ball {  
private:
    static double m_radii[MAX_NUM_RADII];

public:
    static int m_netEntanglements;  // debug
    static int m_numRadii;

    static void computeAllRadii(int largestRadius);

public:
    double m_xPxPerMs, m_yPxPerMs;
    double m_x, m_y;
    double m_lastx, m_lasty;
    int m_radiiIdx;  // ball size -- starts at zero, increments by 1 until it reaches m_numRadii
   Ball* m_pair;

    Ball(double x, double y, int radiiIdx, double deltaX, double deltaY);           
    void draw(twrCanvas& canvas);
    void move(double stepTime);
    Ball * split();
    double getRadius();
    void clearEntanglements();
    void entanglePair(Ball& a, Ball& b);
    bool isEntangled(Ball& b);
    bool isCollision(Ball& b);
    void reverseMove();
    void setLastPos();
};

//////////////////////////////////////////////////////////////////////////////////

int Ball::m_numRadii;
double Ball::m_radii[MAX_NUM_RADII];

//////////////////////////////////////////////////////////////////////////////////

Ball::Ball(double x, double y, int radiiIdx, double xPxPerMs, double yPxPerMs)  {
  assert(radiiIdx<m_numRadii);

  m_x=x;
  m_y=y;
  m_lastx=-1;
  m_lasty=-1;
  m_xPxPerMs=xPxPerMs;
  m_yPxPerMs=yPxPerMs;
  m_radiiIdx=radiiIdx;
}

void Ball::computeAllRadii(int largestRadius) {
  int n=0;
  double r=largestRadius;
  while (r>MIN_BALL_RADIUS) {
    m_radii[n++]=r;
    assert(n<=MAX_NUM_RADII);
    r=r*.707;
  }
  
  m_numRadii=n;
}

double Ball::getRadius() {
  assert(m_numRadii<=MAX_NUM_RADII);
  return m_radii[m_radiiIdx];
}

void Ball::draw(twrCanvas& canvas) {
  canvas.createRadialGradient(ID_GRADIENT, m_x, m_y, 0, m_x, m_y, getRadius());
  canvas.addColorStop(ID_GRADIENT, 0, "#AED6F1");
  canvas.addColorStop(ID_GRADIENT, 1, "#21618C");
  canvas.setFillStyleGradient(ID_GRADIENT);
  canvas.releaseID(ID_GRADIENT);   // releases the internal reference so that JS will garbage collect it when done.
  canvas.beginPath();
  canvas.arc(m_x, m_y, getRadius(), 0.0, PI*2, true);
  canvas.fill();
}

void Ball::setLastPos() {
  m_lastx=m_x;
  m_lasty=m_y;
}

void Ball::move(double stepTime) {
  assert(stepTime>0);

  setLastPos();

  assert(fabs(m_xPxPerMs)*stepTime <= 1);
  assert(fabs(m_yPxPerMs)*stepTime <= 1);

  m_x+=m_xPxPerMs*stepTime;
  m_y+=m_yPxPerMs*stepTime;
}

void Ball::reverseMove() {
  assert(m_lastx!=-1);
  m_x=m_lastx;
  // not a stack, so catch attempted logic error trying to do multiple reverses
  m_lastx=-1;

  assert(m_lasty!=-1);
  m_y=m_lasty;
  // not a stack, so catch attempted logic error trying to do multiple reverses
  m_lasty=-1;
}

Ball* Ball::split() {
  if (m_radiiIdx+1 >= m_numRadii)
    return NULL;

  if (m_pair) 
    return NULL;  // entangled balls can't split while entangled (because they can ony be entangled to one other ball)

  const double theta_prime = 33.3333*PI/180.0;      // given: 33.33 deg angle for new balls from current ball vector

  m_radiiIdx++; // go to next smaller size

  // to rotate coordinate system
  //xˆ = x cos θ + y sin θ and ˆy = −x sin θ + y cos θ
  const double dx=m_xPxPerMs;
  const double dy=m_yPxPerMs;
  const double x_prime = dx*cos(theta_prime)+dy*sin(theta_prime);
  const double y_prime = -dx*sin(theta_prime)+dy*cos(theta_prime);

  // p=PI*A*V ~ rad*rad*v, if area (aka mass) halfs, |V| doubles, and rad is .707*rad
  // but there are two new balls with half the mass each, so |velocity| of each remains the same

  m_xPxPerMs=x_prime;  
  m_yPxPerMs=y_prime;

  const double x_prime2 = dx*cos(-theta_prime)+dy*sin(-theta_prime);
  const double y_prime2 = -dx*sin(-theta_prime)+dy*cos(-theta_prime);

  Ball * nb=new Ball(m_x, m_y, m_radiiIdx, x_prime2, y_prime2);

  // entangle new pair until they separate
  entanglePair(*this, *nb);

  return nb;
}

static double sq(double a) {
  return a*a;
}

static bool isOverlap(Ball& a, Ball& b) {
  const double distance=sqrt( sq(a.m_x-b.m_x) + sq(a.m_y-b.m_y) );
  const bool overlap =  (a.getRadius()+b.getRadius()) > distance;

  return (&b != &a) && overlap;
}

// collision is when only the outer pixels overlap.
// when balls split, theythey are not coliding
bool Ball::isCollision(Ball& b) {
  assert(this!=&b);
  return isOverlap(*this, b) && !isEntangled(b);
}

// when balls split, they are entangled until they separate
bool Ball::isEntangled(Ball& b) {
  assert(this!=&b);
  return this->m_pair==&b && b.m_pair==this;
}

void Ball::clearEntanglements() {
  assert(this->m_pair!=this);
  assert(this->m_pair && this->m_pair->m_pair==this);
  m_netEntanglements--;
  //twr_dbg_printf("m_netEntanglements %d\n", m_netEntanglements);
  this->m_pair->m_pair=NULL;
  this->m_pair=NULL;
}

void Ball::entanglePair(Ball& a, Ball& b) {
  assert(a.m_pair==NULL && b.m_pair==NULL);
  assert(&a!=&b);
  m_netEntanglements++;
  //twr_dbg_printf("m_netEntanglements %d\n", m_netEntanglements);
  a.m_pair=&b;
  b.m_pair=&a;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define MAX_BALLS 150
#define GF_HDR_HEIGHT 30

class GameField  {
  private:
    twrCanvas &m_canvas;    

  public:
    GameField(double ballSpeed);
    void draw();
    void moveBalls(double stepTime);
    void clearExpiredEntanglements();
    double getFastestBallTime();
    void showEntanglements();

    colorRGB m_backcolor;
    colorRGB m_forecolor;
    int m_width;
    int m_height;
    int m_numBalls;
    int m_fps;

private:
    bool handleWallCollision(int n);
    bool handleBallCollisions(int n, int snapNum);
    bool hitRightEdge(Ball&);
    bool hitLeftEdge(Ball&);
    bool hitBottomEdge(Ball&);
    bool hitTopEdge(Ball&);
    Ball * splitBall(int n);
    void checkerBoard();
    void computeBallSizes();
    void computeBallRadii(int largest);
    void drawBorders();
    void drawBallCount();
    void drawAllBalls();
    void renderTests();

    Ball* m_balls[MAX_BALLS];
};

//////////////////////////////////////////////////////////////////////////////////

GameField::GameField(double ballSpeed) : m_canvas(*(new twrCanvas())) {
  m_backcolor=CSSCLR_BLACK; // black
  m_forecolor=CSSCLR_GRAY10;  // light gray
	m_width=d2d_get_canvas_prop("canvasWidth");
	m_height=d2d_get_canvas_prop("canvasHeight");
  const int minDim=__min(m_width, m_height);
  const int r=minDim/5;
  Ball::computeAllRadii(r);

  m_balls[0]=new Ball(r+10,  m_height/2, 0, ballSpeed, 0);
  m_balls[1]=new Ball(m_width-r-10, m_height/2, 0, -ballSpeed, 0);
  m_numBalls=2;
}

void GameField::draw() {
// note that with twrWasmModuleAsync, it is important to draw the entire frame between startDrawSequence() and endDrawSequence,
// without a flush() (or measureText() which causes a flush ), otherwise you might get a flash.

  m_canvas.startDrawSequence();

  m_canvas.setFont("bold 16px monospace");
  m_canvas.setFillStyleRGB(m_backcolor);

  renderTests();

  m_canvas.fillRect(0, 0, m_width, m_height);

  checkerBoard();  // this will overwrite most of above fillRect.  putImageData() does 'respect' the existing canvas alpha

  if (testMode) {
    void drawAsHeart(twrCanvas& canvas, short x, short y);
    drawAsHeart(m_canvas, m_width/2, m_height/2);
  }

  drawBorders();
  drawBallCount();
  drawAllBalls();

  m_canvas.endDrawSequence();

}

void GameField::drawBorders() {
  m_canvas.setFillStyleRGB(m_backcolor);
  m_canvas.setStrokeStyleRGB(m_forecolor);
  m_canvas.setLineWidth(2);
  m_canvas.strokeRect(1, 1, m_width-2, m_height-2);

  //m_canvas.setFillStyleRGB(m_backcolor);
  //m_canvas.setStrokeStyleRGB(m_forecolor);

  m_canvas.beginPath();
  m_canvas.moveTo(0, GF_HDR_HEIGHT);
  m_canvas.lineTo(m_width, GF_HDR_HEIGHT);
  m_canvas.stroke();
}

void GameField::drawBallCount() {
  static char buf[40];  // Canvas::fillText() does not make a copy of string, and data needs to persist until endDrawSequence() called

  m_canvas.setFillStyleRGB(m_forecolor);
  snprintf(buf, sizeof(buf), "BALLS: %d MAX %d FPS: %d", m_numBalls, MAX_BALLS, m_fps);
  m_canvas.fillText(buf, 15, 7);
}

void GameField::drawAllBalls() {
  for (int i=0; i< m_numBalls; i++)
    m_balls[i]->draw(m_canvas);
}

void GameField::renderTests() {
// this sequence is here to test the C++ canvas functions.  they dont do anything useful 
  m_canvas.save();  // functional test of this is in maze
  m_canvas.setFillStyleRGBA(0xFF000000);  //red
  m_canvas.restore();

  // next two are here to test the C++ canvas functions.  they don't do anything useful 
  // they are okay here (no flashes in twrWasmModuleAsync) because nothing has been rendered on screen yet.
  m_canvas.flush();  // not needed, just a tiny test of flush()
  struct d2d_text_metrics tm;
  m_canvas.measureText("X", &tm);  // functional test of this is in maze
  //twr_dbg_printf("balls tm.width %g\n", tm.width);
  //twr_dbg_printf("balls tm.fontBoundingBoxAscent %g\n", tm.fontBoundingBoxAscent);
}

double GameField::getFastestBallTime() {
  double max=0;
  for (int i=0; i < m_numBalls; i++) {
    if (max<fabs(m_balls[i]->m_xPxPerMs)) max=fabs(m_balls[i]->m_xPxPerMs);
    if (max<fabs(m_balls[i]->m_yPxPerMs)) max=fabs(m_balls[i]->m_yPxPerMs);
  }
  return max;
}

void GameField::clearExpiredEntanglements() {
  for (int i=0; i < m_numBalls; i++) 
    for (int j=i+1; j < m_numBalls; j++) 
      if (m_balls[i]->isEntangled(*m_balls[j]))
        if (!isOverlap(*m_balls[i], *m_balls[j])) 
          m_balls[i]->clearEntanglements();
}

void GameField::showEntanglements() {
  double max=0;
  int numPairs=0;
  int numEntangles=0;
  for (int i=0; i < m_numBalls; i++) {
      if (m_balls[i]->m_pair) numPairs++;
  }

  for (int i=0; i < m_numBalls; i++) 
    for (int j=0; j < m_numBalls; j++) 
      if (i!=j)
        if (m_balls[i]->isEntangled(*m_balls[j]))
          numEntangles++;

  if (numPairs!=numEntangles) twr_dbg_printf("!!!!!!NumPairs!=numEntangles %d %d\n",numPairs, numEntangles);
  twr_dbg_printf("numPairs==%d\n",numPairs);
}

  static bool sameSign(int a, int b) {
    return (a>0 && b>0) || (a<0 && b<0);
  }

void GameField::moveBalls(double stepTime) {
  assert (m_numBalls<=MAX_BALLS);
  const int snapNum=m_numBalls;
  for (int i=0; i < snapNum; i++) {
    m_balls[i]->move(stepTime);
    bool hit=handleWallCollision(i);
    hit = hit || handleBallCollisions(i, snapNum);
    if (hit) {
        m_balls[i]->reverseMove(); 
    }
  }
}

bool GameField::handleWallCollision(int n) {
  Ball &b = *m_balls[n];
  bool hit=false;
  if ( hitRightEdge(b) ) {
    b.m_xPxPerMs = -b.m_xPxPerMs;
    // ball can be subject to multiple collisions in each step.  
    // This ensures it does't stay in perpetual collision detection
    hit=true;
  }
  else if ( hitLeftEdge(b) ) {
    b.m_xPxPerMs = -b.m_xPxPerMs;
    hit=true;
  }

  if ( hitBottomEdge(b) ) {
    b.m_yPxPerMs = -b.m_yPxPerMs;
    // ball can hit two walls at once, but we should only reverse direction once per step
    hit=true;

  }
  else if ( hitTopEdge(b) ) {
    b.m_yPxPerMs = -b.m_yPxPerMs;
    hit=true;
  }

  return hit;
}

bool GameField::hitRightEdge(Ball &b) {
  return b.m_x + b.getRadius() >= m_width;
}

bool GameField::hitLeftEdge(Ball &b) {
  return b.m_x - b.getRadius() <= 0;
}

bool GameField::hitBottomEdge(Ball &b) {
  return b.m_y + b.getRadius() >= m_height;
}

bool GameField::hitTopEdge(Ball &b) {
  return b.m_y - b.getRadius() <= GF_HDR_HEIGHT;
}

bool GameField::handleBallCollisions(int n, int snapNum) {

// check every combination of balls
  int hit=0;
  int hit0j;
  Ball* hit_balls[20];  // seems like we will never get this big. 
  Ball& bn=*m_balls[n];
  for (int j=n+1; j < snapNum; j++) {
    Ball& bj=*m_balls[j];

    if (bn.isCollision(bj)) {
      // a ball can collide with multiple balls/wall in each step
      if (hit==0) hit0j=j;
      hit_balls[hit++]=&bj;
    }
  }
  // ignores mass differences, so this isn't real physics
  // and we are only swapping with the last ball collided with 

  if (hit) {
    double tx=bn.m_xPxPerMs/hit;
    double ty=bn.m_yPxPerMs/hit;

    bn.m_xPxPerMs=0;
    bn.m_yPxPerMs=0;

    for (int i=0; i < hit; i++) {
      bn.m_xPxPerMs+=hit_balls[i]->m_xPxPerMs;
      hit_balls[i]->m_xPxPerMs=tx;

      bn.m_yPxPerMs=hit_balls[i]->m_yPxPerMs;
      hit_balls[i]->m_yPxPerMs=ty;
    }

    // occasionally split the ball if it has collided
    // slow down the splits as the number of balls gets larger
    const double base=4;
    double scalePct=base/(double)m_numBalls;
    if (scalePct < .002) scalePct=.002;
    if (scalePct > 1.0) scalePct=1.0;
    if (rand() < (int)((double)RAND_MAX*scalePct)) {
      int bnr=bn.getRadius();
      //!!!! should we split more than one hit ball????
      if (m_numBalls<MAX_BALLS && bn.getRadius()>=hit_balls[0]->getRadius()) {
        splitBall(n);
      }

      if (m_numBalls<MAX_BALLS && hit_balls[0]->getRadius()>=bnr) {
        splitBall(hit0j);
      }
    }
  }

  return hit;
}

Ball * GameField::splitBall(int n) {
  Ball* nb=m_balls[n]->split();
  if (nb) {
    m_balls[m_numBalls++]=nb;
    assert (m_numBalls<=MAX_BALLS);
    assert (nb->m_radiiIdx<nb->m_numRadii);
  }
  return nb;
}

// uses ImageData/putImageData to draw checkerboard, as test/example
void GameField::checkerBoard() {
  static const int W=100;
  static const int H=100;
  static unsigned char bitmapDark[W*H*4];  // pos 0->Red, 1->Green, 2->Blue, 3->Alpha
  static unsigned char bitmapWhite[W*H*4];  
  static bool first=true;

  if (first) {
    first=false;
    for (int i=0; i < W*H*4; i=i+4) {
      //
      bitmapDark[i]=CSSCLR_GRAY5>>16;
      bitmapDark[i+1]=(CSSCLR_GRAY5>>8)&0xFF;
      bitmapDark[i+2]=CSSCLR_GRAY5&0xFF;
      bitmapDark[i+3]=0xFF;

      bitmapWhite[i]=0xFF;
      bitmapWhite[i+1]=0xFF;
      bitmapWhite[i+2]=0xFF;
      bitmapWhite[i+3]=0xFF;
    }

    m_canvas.imageData(ID_DARKBITMAP, &bitmapDark, sizeof(bitmapDark), W, H);  
    m_canvas.imageData(ID_WHITEBITMAP, &bitmapWhite, sizeof(bitmapWhite), W, H);
  }

// this demos modifying memory bits between calls to putImageData
  static unsigned char x = 0x80;
  static unsigned adj=1;
  for (int i=0; i < W*H*4; i=i+4) {
    bitmapDark[i]=x;
    bitmapDark[i+1]=x;
    bitmapDark[i+2]=x;
    bitmapDark[i+3]=0xFF;
  }
  x+=adj;
  if (x==0x80 || x==0xC0) adj=-adj;

  for (int y=0; y<m_height-GF_HDR_HEIGHT; y=y+H) {
    for (int x=0; x<m_width; x=x+W*2) {
      if ((y%(H*2))==0) {
        // there is an overloaded version of putImageData() that lets you specify the region that changed
        m_canvas.putImageData(ID_DARKBITMAP, x, y+GF_HDR_HEIGHT);
        m_canvas.putImageData(ID_WHITEBITMAP, x+W, y+GF_HDR_HEIGHT);
      }
      else {
        m_canvas.putImageData(ID_WHITEBITMAP, x, y+GF_HDR_HEIGHT);
        m_canvas.putImageData(ID_DARKBITMAP, x+W, y+GF_HDR_HEIGHT);
      }
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


GameField *theField;   // global objects init not implemented (yet)

extern "C" void __wasm_call_ctors();

extern "C" int bounce_balls_init(double ballSpeed) {

// __wasm_call_ctors() is generated by wasm-ld, but it appears only if there is a constructor
// not sure how to solve that in the general case when i move it into twr_wasm_init()
// I could call from JS and check if its defined/exported?  But doesn't seem to solve the issue below (wasm-ld linker is looking for it)
//I could use __attribute__((constructor)) on a dummy function so that there is always a constructor
// note there is also a __wasm_call_dtors

// if i don't explicitly call __wasm_call_ctors(), the linker appears to generate code to call it prior to every function call.
// that's what my tests showed, and perhaps this post is relevant:
// https://reviews.llvm.org/D81689
// that doesn't seem like what I want to happen.

  __wasm_call_ctors();   // call all the global static constructors

  theField = new GameField(ballSpeed);
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move(int interval) {
  //time_t start, move, draw, end;
    //time(&start);

  theField->m_fps=(int)(1000.0/(double)interval);

  // this algo moves fastest ball in single pixel increments. 
  // This is (a) smoother, (b) avoids balls impinging into other balls, (c) simplifies collision detection
  static const double stepTime=0.5;  // move balls in half ms steps.  implies max speed of 2000px/sec
  const int numTicks=(int)((double)interval)/stepTime;  // number of tickets so that interval time passes (the time between calls to us)

  //twr_dbg_printf("fastest ball speed is %g px/sec\n", 1000*theField->getFastestBallTime());

  if (theField->m_numBalls<MAX_BALLS) {
    for (int i=0; i<numTicks;i++) {
      theField->clearExpiredEntanglements(); // created by ball split, which can happen in handleCollisions()
      theField->moveBalls(stepTime);  // move max 1 px
    }
    theField->draw();
  }

  return 0;
}