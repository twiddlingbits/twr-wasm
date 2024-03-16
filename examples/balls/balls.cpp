#include <stddef.h>
#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include "canvas.h"

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

// new & delete operators are defined in std libc++, which is not implemented (yet?)
void* operator new (twr_size_t sz)
{
  void *p;

  if (__builtin_expect (sz == 0, false))
    sz = 1;

  if ((p = twr_malloc (sz)) == 0)
    __builtin_trap();

  return p;
}

void operator delete(void* ptr) noexcept
{
  twr_free(ptr);
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


void drawAsHeart(twrCanvas& canvas, short x, short y) {
    canvas.beginPath();
    canvas.setFillStyleRGB(CSSCLR_GRAY10);
    canvas.moveTo(x, y);
    canvas.bezierCurveTo(x, y-40+37, x-75+70, y-40+25, x-75+50, y-40+25);
    canvas.bezierCurveTo(x+20-75, y-40+25, x-75+20, y-40+62.5, x-75+20, y-40+62.5);
    canvas.bezierCurveTo(x+20-75, y-40+80, x-75+40, y-40+102, x-75+75, y-40+120);
    canvas.bezierCurveTo(x+110-75, y-40+102, x-75+130, y-40+80, x-75+130, y-40+62.5);
    canvas.bezierCurveTo(x+130-75, y-40+62.5, x-75+130, y-40+25, x-75+100, y-40+25);
    canvas.bezierCurveTo(x+10, y-40+25, x, y-40+37, x, y-40+40);
    canvas.fill();
}

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

class Ball {  
  public:
    colorRGB m_color;
    double m_x, m_y;
    double m_deltaX, m_deltaY;
    double m_radius; 
    OverlappingPairList * m_OverlappingPairList;

    Ball(double x, double y, double r, double deltaX, double deltaY, colorRGB color);           
    void draw(twrCanvas& canvas);
    void move();
    static bool isOverlap(Ball& a, Ball& b);

};

Ball::Ball(double x, double y, double r, double deltaX, double deltaY, colorRGB color)  {
  m_x=x;
  m_y=y;
  m_deltaX=deltaX;
  m_deltaY=deltaY;
  m_radius=r;
  m_color=color;  
}

void Ball::draw(twrCanvas& canvas) {
  canvas.setFillStyleRGB(m_color);
  canvas.beginPath();
  canvas.arc(m_x, m_y, m_radius, 0.0, PI*2, true);
  canvas.fill();
}


void Ball::move() {
  //twr_dbg_printf("Ball::move() this %x  r %g m_x %g, m_deltaX %g, m_y %x, m_deltaY %g\n",this, m_radius, m_x, m_deltaX, m_y, m_deltaY);
  m_x+=m_deltaX;
  m_y+=m_deltaY;
}

static double sq(double a) {
  return a*a;
}

bool Ball::isOverlap(Ball& a, Ball& b) {
  const double distance=sqrt( sq(a.m_x-b.m_x) + sq(a.m_y-b.m_y) );
  const bool overlap =  (a.m_radius+b.m_radius) >= distance;

  return (&b != &a) && overlap;
}
/*
void Ball::checkRemoveOverlappingPairs() {

    OverlappingPair * e=m_OverlappingPairList->m_first, *p=NULL;

    while(e) {
      Ball & b=e->m_ball;
      if (!isCol(*this, b)) {
          removeOverlappingPair(b);  // could remove current node
          e=p;  // last safe node
      }
      else {
        p=e;
        e=e->m_next;
      }
  }
}
*/

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define MAX_BALLS 200
#define GF_HDR_HEIGHT 30
#define DEFAULT_BALL_COLOR 0xFF0000
//CSSCLR_BLUE20

class GameField  {
  private:
    twrCanvas &m_canvas;    

  public:
    GameField();
    void draw();
    void moveBalls();
    void handleCollisions();
    bool hitRightEdge(Ball*);
    bool hitLeftEdge(Ball*);
    bool hitBottomEdge(Ball*);
    bool hitTopEdge(Ball*);
    Ball * splitBall(int n);
    void checkerBoard();
    void buildOverlappingPairs();

    colorRGB m_backcolor;
    colorRGB m_forecolor;
    int m_width;
    int m_height;
    int m_numBalls;
    OverlappingPairList m_overlappingPairs;
    Ball* m_balls[MAX_BALLS];
};

GameField::GameField() : m_overlappingPairs(), m_canvas(*(new twrCanvas())) {
  m_backcolor=CSSCLR_BLACK; // black
  m_forecolor=CSSCLR_GRAY10;  // light gray
	m_width=d2d_get_canvas_prop("canvasWidth");
	m_height=d2d_get_canvas_prop("canvasHeight");
  m_numBalls=2;
  const int minDim=__min(m_width, m_height);
  const int r=minDim/5;
  m_balls[0]=new Ball(r+10,  m_height/2, r, +4.0, 0, DEFAULT_BALL_COLOR);
  m_balls[1]=new Ball(m_width-r-10, m_height/2, r, -4.0, 0, DEFAULT_BALL_COLOR);
}

void GameField::draw() {
  char buf[40];

// note that with twrWasmModuleAsync, it is important to draw the entire frame between startDrawSequence() and endDrawSequence,
// without a flush() (or measureText() which causes a flush ), otherwise you might get a flash.
  m_canvas.startDrawSequence();

  m_canvas.setFont("bold 16px monospace");
  m_canvas.setFillStyleRGB(m_backcolor);

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

  m_canvas.fillRect(0, 0, m_width, m_height);

  checkerBoard();  // this will overwrite most of above fillRect.  putImageData() does 'respect' the existing canvas alpha

  drawAsHeart(m_canvas, m_width/2, m_height/2);

  m_canvas.setFillStyleRGB(m_backcolor);
  m_canvas.setStrokeStyleRGB(m_forecolor);
  m_canvas.setLineWidth(2);
  m_canvas.strokeRect(1, 1, m_width-2, m_height-2);

  m_canvas.setFillStyleRGB(m_backcolor);
  m_canvas.setStrokeStyleRGB(m_forecolor);

  m_canvas.beginPath();
  m_canvas.moveTo(0, GF_HDR_HEIGHT);
  m_canvas.lineTo(m_width, GF_HDR_HEIGHT);
  m_canvas.stroke();

  m_canvas.setFillStyleRGB(m_forecolor);
  snprintf(buf, sizeof(buf), "BALLS: %d", m_numBalls);
  m_canvas.fillText(buf, 15, 7);

  for (int i=0; i< m_numBalls; i++)
    m_balls[i]->draw(m_canvas);

  m_canvas.endDrawSequence();

}

void GameField::moveBalls() {

  const int n=m_numBalls;
  for (int i=0; i < n && m_numBalls<MAX_BALLS; i++) {
    m_balls[i]->move();
    
    if ( hitRightEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_width - m_balls[i]->m_radius - 1;
    }
    else if ( hitLeftEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_balls[i]->m_radius + 1;
    }
    else if ( hitBottomEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_height - m_balls[i]->m_radius - 1;
    }
    else if ( hitTopEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_balls[i]->m_radius + 1 + GF_HDR_HEIGHT;
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
        const double base=1;
        double scalePct=base/(double)m_numBalls;
        if (scalePct < .001) scalePct=.001;
        //twr_dbg_printf("scalePct=%g, cmpr=%d\n",scalePct, (int)((double)RAND_MAX*scalePct));
        if (rand() < (int)((double)RAND_MAX*scalePct)) {
          int bir=bi.m_radius;
          if (m_numBalls<MAX_BALLS && bi.m_radius>=bj.m_radius) {
            splitBall(i);
          }

          if (m_numBalls<MAX_BALLS && bj.m_radius>=bir) {
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
  return b->m_x + b->m_radius >= m_width;
}

bool GameField::hitLeftEdge(Ball *b) {
  return b->m_x - b->m_radius <= 0;
}

bool GameField::hitBottomEdge(Ball *b) {
  return b->m_y + b->m_radius >= m_height;
}

bool GameField::hitTopEdge(Ball *b) {
  return b->m_y - b->m_radius <= GF_HDR_HEIGHT;
}

Ball * GameField::splitBall(int n) {

  assert ((m_numBalls+1) <= MAX_BALLS);


  Ball &b=*m_balls[n];
  if (b.m_radius<=2) {
    twr_dbg_printf("split aborted\n");
    return NULL;  // stop splitting
  }

  const double theta_prime = 33.3333*PI/180.0;      // given: 33.33 deg angle for new balls from current ball vector

  // to rotate coordinate system
  //xˆ = x cos θ + y sin θ and ˆy = −x sin θ + y cos θ
  const double dx=b.m_deltaX;
  const double dy=b.m_deltaY;
  const double x_prime = dx*cos(theta_prime)+dy*sin(theta_prime);
  const double y_prime = -dx*sin(theta_prime)+dy*cos(theta_prime);

  // p=PI*A*V ~ rad*rad*v, if area (aka mass) halfs, |V| doubles, and rad is .707*rad
  // but there are two new balls with half the mass each, so |velocity| of each remains the same

  b.m_deltaX=x_prime;  
  b.m_deltaY=y_prime;
  b.m_radius= b.m_radius*0.707;
  b.m_color=DEFAULT_BALL_COLOR; 

  const double x_prime2 = dx*cos(-theta_prime)+dy*sin(-theta_prime);
  const double y_prime2 = -dx*sin(-theta_prime)+dy*cos(-theta_prime);

  Ball * nb=new Ball(b.m_x, b.m_y, b.m_radius, x_prime2, y_prime2, DEFAULT_BALL_COLOR);
  //m_balls[m_numBalls]->copyOverlappingPairs(b);
  //m_balls[m_numBalls]->addOverlappingPair(b);
  m_balls[m_numBalls++]=nb;
  assert (m_numBalls<=MAX_BALLS);

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

    m_canvas.imageData(&bitmapDark, sizeof(bitmapDark), W, H);
    m_canvas.imageData(&bitmapWhite, sizeof(bitmapWhite), W, H);
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
        m_canvas.putImageData(&bitmapDark, x, y+GF_HDR_HEIGHT);
        m_canvas.putImageData(&bitmapWhite, x+W, y+GF_HDR_HEIGHT);
      }
      else {
        m_canvas.putImageData(&bitmapWhite, x, y+GF_HDR_HEIGHT);
        m_canvas.putImageData(&bitmapDark, x+W, y+GF_HDR_HEIGHT);
      }
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


GameField *theField;   // global objects init not implemented (yet)

extern "C" int bounce_balls_init() {

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