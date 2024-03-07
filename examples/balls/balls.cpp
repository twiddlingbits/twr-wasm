#include <stddef.h>
#include <stdlib.h>
#include <assert.h>
#include "twr-draw2d.h"

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

typedef unsigned long typeColor;
#define PI 3.14159265359

class twrCanvas {
  public:
    twrCanvas();
    void startDrawSequence(int n=10);
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
    unsigned long m_color;
    int m_x,m_y;
    int m_deltaX,m_deltaY;
    int m_radius; 
    Ball(int x, int y, int r, int deltaX, int deltaY, typeColor color);           
    void draw(twrCanvas& canvas);
    void move();
};

Ball::Ball(int x, int y, int r, int deltaX, int deltaY, typeColor color)  {
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
  m_x+=m_deltaX;
  m_y+=m_deltaY;
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

#define MAX_BALLS 100

class GameField  {
  private:
    twrCanvas &m_canvas;    

  public:
    GameField();
    void draw();
    void moveBalls();
    bool hitRightEdge(Ball*);
    bool hitLeftEdge(Ball*);
    bool hitBottomEdge(Ball*);
    bool hitTopEdge(Ball*);

    unsigned long m_color;
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
  m_balls[0]=new Ball(m_width/2, m_height/2, 50, 5, 1, 0xFF0000);
}

void GameField::draw() {

  m_canvas.startDrawSequence();

  m_canvas.setFillStyle(m_color);
  m_canvas.fillRect(0, 0, m_width, m_height);

  for (int i=0; i< m_numBalls; i++)
    m_balls[i]->draw(m_canvas);

  m_canvas.endDrawSequence();

}

void GameField::moveBalls() {

  for (int i=0; i< m_numBalls; i++) {
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
      m_balls[i]->m_y = m_balls[i]->m_radius + 1;
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


//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


GameField *theField;   // global objects init not implemented (yet)

extern "C" int bounce_balls_init() {
  theField = new GameField();
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move() {

  theField->moveBalls();
  theField->draw();

  return 0;
}