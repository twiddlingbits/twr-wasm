#include <stddef.h>
#include <stdlib.h>
#include <assert.h>
#include <time.h>
#include <math.h>
#include "twr-draw2d.h"
#include "twr-wasm.h"

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

typedef unsigned long typeColor;
#define PI 3.14159265359

class twrCanvas {
  public:
    twrCanvas();
    void startDrawSequence(int n=1000);
    void endDrawSequence();
    void beginPath();
    void fill();
    void stroke();
    void setFillStyle(typeColor color);
    void setStrokeStyle(typeColor color);
    void setLineWidth(short width);
    void fillRect(short x, short y, short w, short h);
    void arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise);

private:
  struct d2d_draw_seq *m_ds;

};

twrCanvas::twrCanvas() {
  m_ds=NULL;
}

void twrCanvas::startDrawSequence(int n) {
  assert(m_ds==NULL);
  m_ds=d2d_start_draw_sequence(n);
  assert(m_ds);
}

void twrCanvas::endDrawSequence() {
    assert(m_ds);
    d2d_end_draw_sequence(m_ds);
    m_ds=NULL;
}

void twrCanvas::beginPath() {
  assert(m_ds);

  d2d_beginpath(m_ds);
}

void twrCanvas::fill() {
  assert(m_ds);

  d2d_fill(m_ds);
}

void twrCanvas::stroke() {
  assert(m_ds);

  d2d_stroke(m_ds);
}

void twrCanvas::setFillStyle(typeColor color) {
  assert(m_ds);

  d2d_setfillstyle(m_ds, color);
}

void twrCanvas::setStrokeStyle(typeColor color) {
  assert(m_ds);

  d2d_setstrokestyle(m_ds, color);
}

void twrCanvas::setLineWidth(short width) {
  assert(m_ds);

  d2d_setlinewidth(m_ds, width);
}

void twrCanvas::fillRect(short x, short y, short w, short h) {
  assert(m_ds);

  d2d_fillrect(m_ds, x, y, w, h);
}

void twrCanvas::arc(short x, short y, short radius, double startAngle, double endAngle, bool counterclockwise) {

  assert(m_ds);

  d2d_arc(m_ds, x, y, radius, startAngle, endAngle, counterclockwise);

}


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

class Ball {  
  public:
    typeColor m_color;
    double m_x, m_y;
    double m_deltaX, m_deltaY;
    int m_radius; 
    Ball(double x, double y, int r, double deltaX, double deltaY, typeColor color);           
    void draw(twrCanvas& canvas);
    void move();
};

Ball::Ball(double x, double y, int r, double deltaX, double deltaY, typeColor color)  {
  m_x=x;
  m_y=y;
  m_deltaX=deltaX;
  m_deltaY=deltaY;
  m_radius=r;
  m_color=color;  // red
}

void Ball::draw(twrCanvas& canvas) {
  canvas.setFillStyle(m_color);
  canvas.beginPath();
  canvas.arc(m_x, m_y, m_radius, 0.0, PI*2, true);
  canvas.fill();
}

void Ball::move() {
  //twr_dbg_printf("Ball::move() this %x  &m_x %x, &m_deltaX %x, &m_y %x, &m_deltaY %x\n",this, &m_x, &m_deltaX, &m_y, &m_deltaY);
  m_x+=m_deltaX;
  m_y+=m_deltaY;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define MAX_BALLS 200

class GameField  {
  public:
    twrCanvas &m_canvas;    

  public:
    GameField();
    void draw();
    void moveBalls();
    bool hitRightEdge(Ball*);
    bool hitLeftEdge(Ball*);
    bool hitBottomEdge(Ball*);
    bool hitTopEdge(Ball*);
    void splitBall(int n);


    typeColor m_color;
    int m_width;
    int m_height;
    int m_numBalls;
    Ball* m_balls[MAX_BALLS];
};

GameField::GameField() : m_canvas(*(new twrCanvas())) {
  m_color=0; // black
  m_width=1000;  //!!!!  ADD FEATURE TO QUERY CANVAS
  m_height=600;
  m_numBalls=1;
  m_balls[0]=new Ball(m_width/2, m_height/2, 75, -3, 0, 0xFF0000);
}

void GameField::draw() {

  m_canvas.startDrawSequence();

  m_canvas.setFillStyle(m_color);
  m_canvas.fillRect(0, 0, m_width, m_height);

  for (int i=0; i< m_numBalls; i++)
    m_balls[i]->draw(m_canvas);

  //m_canvas.endDrawSequence();

}

void GameField::moveBalls() {

  const int n=m_numBalls;
  for (int i=0; i < n && m_numBalls<MAX_BALLS; i++) {
    m_balls[i]->move();
    
    if ( hitRightEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_width - m_balls[i]->m_radius - 1;
      splitBall(i);
    }
    else if ( hitLeftEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaX = -m_balls[i]->m_deltaX;
      m_balls[i]->m_x = m_balls[i]->m_radius + 1;
      splitBall(i);
    }
    else if ( hitBottomEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_height - m_balls[i]->m_radius - 1;
      splitBall(i);
    }
    else if ( hitTopEdge(m_balls[i]) ) {
      m_balls[i]->m_deltaY = -m_balls[i]->m_deltaY;
      m_balls[i]->m_y = m_balls[i]->m_radius + 1;
      splitBall(i);
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
  return b->m_y - b->m_radius <= 0;
}

void GameField::splitBall(int n) {
  Ball &b=*m_balls[n];
  if (b.m_radius<=2) {
    twr_dbg_printf("split aborted\n");
    return;  // stop splitting
  }

  const double theta_prime = 33.3333*PI/180.0;      // given: 33.33 deg angle for new balls from current ball vector

  // to rotate coordinate system
  //xˆ = x cos θ + y sin θ and ˆy = −x sin θ + y cos θ
  const double dx=b.m_deltaX;
  const double dy=b.m_deltaY;
  const double x_prime = dx*(double)cos(theta_prime)+dy*(double)sin(theta_prime);
  const double y_prime = -dx*(double)sin(theta_prime)+dy*(double)cos(theta_prime);

  // p=PI*A*V ~ rad*rad*v, if area (aka mass) halfs, |V| doubles, and rad is .707*rad
  // but there are two new balls with half the mass each, so |velocity| of each remains the same

  b.m_deltaX=x_prime;  
  b.m_deltaY=y_prime;
  b.m_radius= ((double)b.m_radius*(double).707);
  b.m_color=0xFF0000;

  const double x_prime2 = dx*(double)cos(-theta_prime)+dy*(double)sin(-theta_prime);
  const double y_prime2 = -dx*(double)sin(-theta_prime)+dy*(double)cos(-theta_prime);

  //double xx=(double)sin(theta_prime);
  //double yy=(double)sin(-theta_prime);too many balls cos() %g cos(-) %g\n", theta_prime, -theta_prime, xx, yy);


  m_balls[m_numBalls++]=new Ball(b.m_x, b.m_y, b.m_radius, x_prime2, y_prime2, 0x00FF00);
  assert (m_numBalls<=MAX_BALLS);
}


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


GameField *theField;   // global objects init not implemented (yet)

extern "C" int bounce_balls_init() {

  twr_wasm_print_mem_debug_stats();

  if (twr_malloc_unit_test()==0) {
    twr_dbg_printf("twr_malloc_unit_test FAIL\n");
    __builtin_trap();
  }

  twr_dbg_printf("twr_malloc_unit_test PASS\n");

  twr_wasm_print_mem_debug_stats();



  theField = new GameField();
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move() {
  time_t start, move, draw, end;

  if (theField->m_numBalls<MAX_BALLS) {
    time(&start);
    theField->moveBalls();
    time(&move);

    theField->draw();
    time(&draw);

    theField->m_canvas.endDrawSequence();
    time(&end);

    twr_dbg_printf("move %dms, draw %dms render %dms\n", move-start, draw-move, end-draw);

  }

  return 0;
}