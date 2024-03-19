#include <stddef.h>
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "canvas.h"

int testMode;

#define ID_DARKBITMAP 1  // any unique long will do
#define ID_WHITEBITMAP 2
#define ID_GRADIENT 3

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

class OverlappingPair {
  class Ball & m_ballA;
  class Ball & m_ballB;
  
public:
  OverlappingPair *m_next;

  OverlappingPair(Ball & a, Ball & b, OverlappingPair * next) : m_ballA(a), m_ballB(b) {
    m_next=next;
  }

  bool match(Ball & a, Ball & b) {
    return (&a==&m_ballA && &b==&m_ballB) || (&a==&m_ballB && &b==&m_ballA);
  }
};

class OverlappingPairList {
  OverlappingPair *m_first;

public:
  OverlappingPairList() {
    m_first=NULL;
  }

  bool containsPair(Ball & a, Ball & b) {
    OverlappingPair *pair=m_first;

    while(pair) {
      if (pair->match(a, b)) return true;
      pair=pair->m_next;
    }
    return false;
  }

  void addPair(Ball & a, Ball & b) {
    m_first=new OverlappingPair(a, b, m_first);
  }

/* not used
  void removePair(Ball & a, Ball & b) {
    OverlappingPair *pair=m_first, *p=NULL;

    while(pair) {
      if (pair->match(a, b)) {
        if (p) p->m_next=pair->m_next;
        else this->m_first=pair->m_next;
        delete pair;
        return;
      }
      p=pair;
      pair=pair->m_next;
    }

    assert(0);
  }
*/

  void clear() {
    OverlappingPair *n;

    while(m_first) {
      n=m_first->m_next;
      delete m_first;
      m_first=n;
    }
  }

};

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define PI 3.14159265359
#define MIN_BALL_RADIUS 10
#define MAX_NUM_RADII 25

class Ball {  
private:
    static int m_numRadii;
    static int m_radii[MAX_NUM_RADII];

public:
    static bool isOverlap(Ball& a, Ball& b);
    static void computeAllRadii(int largestRadius);

  private:
    OverlappingPairList * m_OverlappingPairList;

public:
    double m_deltaX, m_deltaY;
    double m_x, m_y;
    int m_radiiIdx;  // starts at zero, increments by 1 until it reaches Ball

    Ball(double x, double y, int radiiIdx, double deltaX, double deltaY);           
    void draw(twrCanvas& canvas);
    void move();
    Ball * split();
    int getRadius();

};

//////////////////////////////////////////////////////////////////////////////////

int Ball::m_numRadii;
int Ball::m_radii[MAX_NUM_RADII];

//////////////////////////////////////////////////////////////////////////////////

Ball::Ball(double x, double y, int radiiIdx, double deltaX, double deltaY)  {
  assert(m_radiiIdx<m_numRadii);

  m_x=x;
  m_y=y;
  m_deltaX=deltaX;
  m_deltaY=deltaY;
  m_radiiIdx=radiiIdx;
}

void Ball::computeAllRadii(int largestRadius) {
  int n=0;
  double r=largestRadius;
  while (r>MIN_BALL_RADIUS) {
    m_radii[n++]=(int)r;
    //twr_dbg_printf("ball n %d r %d\n", n-1, m_radii[n-1]);
    assert(n<=MAX_NUM_RADII);
    r=r*.707;
  }
  
 // twr_dbg_printf("A [0] %d compilerbug %d\n",  m_radii[0], compilerbug);
 // twr_dbg_printf("A [0] %d \n",  m_radii[0]);
  m_numRadii=n;
//  twr_dbg_printf("B [0] %d\n",  m_radii[0]);

//   for (int z=0; z<m_numRadii;z++)
//     twr_dbg_printf("zzball z %d r %d\n", z, m_radii[z]);
}

int Ball::getRadius() {
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

void Ball::move() {
  //twr_dbg_printf("Ball::move() this %x  r %g m_x %g, m_deltaX %g, m_y %x, m_deltaY %g\n",this, getRadius(), m_x, m_deltaX, m_y, m_deltaY);
  m_x+=m_deltaX;
  m_y+=m_deltaY;
}

Ball* Ball::split() {
  if (m_radiiIdx+1 >= m_numRadii)
    return NULL;

  const double theta_prime = 33.3333*PI/180.0;      // given: 33.33 deg angle for new balls from current ball vector

  // to rotate coordinate system
  //xˆ = x cos θ + y sin θ and ˆy = −x sin θ + y cos θ
  const double dx=m_deltaX;
  const double dy=m_deltaY;
  const double x_prime = dx*cos(theta_prime)+dy*sin(theta_prime);
  const double y_prime = -dx*sin(theta_prime)+dy*cos(theta_prime);

  // p=PI*A*V ~ rad*rad*v, if area (aka mass) halfs, |V| doubles, and rad is .707*rad
  // but there are two new balls with half the mass each, so |velocity| of each remains the same

  m_deltaX=x_prime;  
  m_deltaY=y_prime;
  m_radiiIdx++; // go to next smaller size

  const double x_prime2 = dx*cos(-theta_prime)+dy*sin(-theta_prime);
  const double y_prime2 = -dx*sin(-theta_prime)+dy*cos(-theta_prime);

  Ball * nb=new Ball(m_x, m_y, m_radiiIdx, x_prime2, y_prime2);

  return nb;
}

static double sq(double a) {
  return a*a;
}

bool Ball::isOverlap(Ball& a, Ball& b) {
  const double distance=sqrt( sq(a.m_x-b.m_x) + sq(a.m_y-b.m_y) );
  const bool overlap =  (a.getRadius()+b.getRadius()) >= distance;

  return (&b != &a) && overlap;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#if 0
class GradCache {
  const int m_maxEntries=100;
  unsigned long m_entries[m_maxEntries];
  m_size;
  Canvas& canvas;

  GradCache(Canvas& canvas) {
    m_size=0;
  }

  get(unsigned long radius) {
    for (int i=0; i<m_maxEntries; i++)
      if (m_entries[i]==radius) 
        return i+100;    // calc a deterministic unique ID, all other ids in this program are < 100

    assert(m_size<this.m_maxEntries);

    m_entries[this.m_size]=radius;
    canvas.createRadialGradient...
    return m_size++;
  }

}
#endif

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define MAX_BALLS 150
#define GF_HDR_HEIGHT 30

class GameField  {
  private:
    twrCanvas &m_canvas;    

  public:
    GameField();
    void draw();
    void moveBalls();
    void handleCollisions();

    colorRGB m_backcolor;
    colorRGB m_forecolor;
    int m_width;
    int m_height;
    int m_numBalls;

private:
    bool hitRightEdge(Ball*);
    bool hitLeftEdge(Ball*);
    bool hitBottomEdge(Ball*);
    bool hitTopEdge(Ball*);
    Ball * splitBall(int n);
    void checkerBoard();
    void buildOverlappingPairs();
    void computeBallSizes();
    void computeBallRadii(int largest);
    void drawBorders();
    void drawBallCount();
    void drawAllBalls();
    void renderTests();
    OverlappingPairList m_overlappingPairs;
    Ball* m_balls[MAX_BALLS];
};

//////////////////////////////////////////////////////////////////////////////////

GameField::GameField() : m_overlappingPairs(), m_canvas(*(new twrCanvas())) {
  m_backcolor=CSSCLR_BLACK; // black
  m_forecolor=CSSCLR_GRAY10;  // light gray
	m_width=d2d_get_canvas_prop("canvasWidth");
	m_height=d2d_get_canvas_prop("canvasHeight");
  const int minDim=__min(m_width, m_height);
  const int r=minDim/5;
  Ball::computeAllRadii(r);

  m_balls[0]=new Ball(r+10,  m_height/2, 0, +4.0, 0);
  m_balls[1]=new Ball(m_width-r-10, m_height/2, 0, -4.0, 0);
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
  snprintf(buf, sizeof(buf), "BALLS: %d of %d", m_numBalls, MAX_BALLS);
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

void GameField::moveBalls() {

  const int n=m_numBalls;
  for (int i=0; i < n && m_numBalls<MAX_BALLS; i++) {
    m_balls[i]->move();
    
    if ( hitRightEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_width - m_balls[i]->getRadius() - 1;
    }
    else if ( hitLeftEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_balls[i]->getRadius() + 1;
    }
    else if ( hitBottomEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_height - m_balls[i]->getRadius() - 1;
    }
    else if ( hitTopEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_balls[i]->getRadius() + 1 + GF_HDR_HEIGHT;
    }
  }
}

static bool sameSign(int a, int b) {
  return (a>0 && b>0) || (a<0 && b<0);
}

void GameField::handleCollisions() {

  const int snapNum=m_numBalls;

  // check every combination of balls
  for (int i=0; i < snapNum; i++) {
    for (int j=i+1; j < snapNum; j++) {
      Ball& bi=*m_balls[i];
      Ball& bj=*m_balls[j];

      // a new overlap is a collision
      if (Ball::isOverlap(bi, bj) && !m_overlappingPairs.containsPair(bi, bj)) {

        // if heading in opposite direction, exchange velocity (they bounce off each other)
        // ignores mass differences, so this isn't real physics
        if (!sameSign(bi.m_deltaX, bj.m_deltaX)) {
          double t=bi.m_deltaX;
          bi.m_deltaX=bj.m_deltaX;
          bj.m_deltaX=t;
        }

        if (!sameSign(bi.m_deltaY, bj.m_deltaY)) {
          double t=bi.m_deltaY;
          bi.m_deltaY=bj.m_deltaY;
          bj.m_deltaY=t;
        }

        // occasionally split the ball if it has collided
        // slow down the splits as the number of balls gets larger
        const double base=4;
        double scalePct=base/(double)m_numBalls;
        if (scalePct < .002) scalePct=.002;
        if (scalePct > 1.0) scalePct=1.0;
        if (rand() < (int)((double)RAND_MAX*scalePct)) {
          int bir=bi.getRadius();
          if (m_numBalls<MAX_BALLS && bi.getRadius()>=bj.getRadius()) {
            splitBall(i);
          }

          if (m_numBalls<MAX_BALLS && bj.getRadius()>=bir) {
            splitBall(j);
          }
        }
      }
    }
  }

  buildOverlappingPairs();
}

  void GameField::buildOverlappingPairs() {
  m_overlappingPairs.clear();

  // check every combination of balls
  for (int i=0; i < m_numBalls; i++) {
    for (int j=i+1; j < m_numBalls; j++) {
      if (Ball::isOverlap(*m_balls[i], *m_balls[j])) {
        m_overlappingPairs.addPair(*m_balls[i], *m_balls[j]);
      }
    }
  }
}


bool GameField::hitRightEdge(Ball *b) {
  return b->m_x + b->getRadius() >= m_width;
}

bool GameField::hitLeftEdge(Ball *b) {
  return b->m_x - b->getRadius() <= 0;
}

bool GameField::hitBottomEdge(Ball *b) {
  return b->m_y + b->getRadius() >= m_height;
}

bool GameField::hitTopEdge(Ball *b) {
  return b->m_y - b->getRadius() <= GF_HDR_HEIGHT;
}

Ball * GameField::splitBall(int n) {
  Ball* nb=m_balls[n]->split();
  if (nb) {
    m_balls[m_numBalls++]=nb;
    assert (m_numBalls<=MAX_BALLS);
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

// this demos modifying memory bits between alls to putImageData
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

extern "C" int bounce_balls_init(int tmode) {

// __wasm_call_ctors() is generated by wasm-ld, but it appears only if there is a constructor
// not sure how to solve that in the general case when i move it into twr_wasm_init()\
// I could use JS and check if its defined/exported?
//I could use __attribute__((constructor)) on a dummy function so that there is always a constructor
// note there is also a __wasm_call_dtors

// if i don't explicitly call __wasm_call_ctors(), the linker appears to generate code to call it prior to every function call.
// that's what my tests showed, and perhaps this post is relevant:
// https://reviews.llvm.org/D81689
// that doesn't seem like what I want to happen.

  __wasm_call_ctors();   // call all the global static constructors

  testMode=tmode; // global
  theField = new GameField();
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move() {
  //time_t start, move, draw, end;

  if (theField->m_numBalls<MAX_BALLS) {

    //twr_dbg_printf("move tick,  m_numBalls==%d\n", theField->m_numBalls);

    //time(&start);
    theField->handleCollisions();
    theField->moveBalls();  // move last so the new move is rendered
    //time(&move);

    theField->draw();
    //time(&draw);

    //theField->m_canvas.endDrawSequence();
    //time(&end);

    //twr_dbg_printf("move %dms, draw %dms render %dms\n", move-start, draw-move, end-draw);

  }

  return 0;
}