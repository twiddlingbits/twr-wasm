#include <stddef.h>
#include <assert.h>
#include <stdio.h>
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

#define PI 3.14159265359
#define MAX_BALLS 200
#define GFHDR_HEIGHT 30

#define DEFAULT_BALL_COLOR 0xFF0000
//CSSCLR_BLUE20

class Ball {  
  public:
    colorRGB m_ballcolor;
    double m_x, m_y;
    double m_deltaX, m_deltaY;
    int m_radius; 
    Ball(double x, double y, int r, double deltaX, double deltaY, colorRGB color);           
    void draw(twrCanvas& canvas);
    void move();
};

Ball::Ball(double x, double y, int r, double deltaX, double deltaY, colorRGB color)  {
  m_x=x;
  m_y=y;
  m_deltaX=deltaX;
  m_deltaY=deltaY;
  m_radius=r;
  m_ballcolor=color;  
}

void Ball::draw(twrCanvas& canvas) {
  canvas.setFillStyleRGB(m_ballcolor);
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


void drawAsHeart(twrCanvas& canvas, short x, short y) {

    //canvas.moveTo(75, 40);
    //canvas.bezierCurveTo(75, 37, 70, 25, 50, 25);
    //canvas.bezierCurveTo(20, 25, 20, 62.5, 20, 62.5);
    //canvas.bezierCurveTo(20, 80, 40, 102, 75, 120);
    //canvas.bezierCurveTo(110, 102, 130, 80, 130, 62.5);
    //canvas.bezierCurveTo(130, 62.5, 130, 25, 100, 25);
    //canvas.bezierCurveTo(85, 25, 75, 37, 75, 40);

    //bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)

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
    void splitBall(int n);
    void checkerBoard();

    colorRGB m_backcolor;
    colorRGB m_forecolor;
    int m_width;
    int m_height;
    int m_numBalls;
    Ball* m_balls[MAX_BALLS];
};


GameField::GameField() : m_canvas(*(new twrCanvas())) {
  m_backcolor=CSSCLR_BLACK; // black
  m_forecolor=CSSCLR_GRAY10;  // light gray
	m_width=d2d_get_canvas_prop("canvasWidth");
	m_height=d2d_get_canvas_prop("canvasHeight");
  m_numBalls=1;
  m_balls[0]=new Ball(m_width/2, m_height/2, 150, -4, 0, DEFAULT_BALL_COLOR);
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
  m_canvas.moveTo(0, GFHDR_HEIGHT);
  m_canvas.lineTo(m_width, GFHDR_HEIGHT);
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
      m_balls[i]->m_y = m_balls[i]->m_radius + 1 + GFHDR_HEIGHT;
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
  return b->m_y - b->m_radius <= GFHDR_HEIGHT;
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
  const double x_prime = dx*cos(theta_prime)+dy*sin(theta_prime);
  const double y_prime = -dx*sin(theta_prime)+dy*cos(theta_prime);

  // p=PI*A*V ~ rad*rad*v, if area (aka mass) halfs, |V| doubles, and rad is .707*rad
  // but there are two new balls with half the mass each, so |velocity| of each remains the same

  b.m_deltaX=x_prime;  
  b.m_deltaY=y_prime;
  b.m_radius= ((double)b.m_radius*(double).707);
  b.m_ballcolor=DEFAULT_BALL_COLOR; 

  const double x_prime2 = dx*cos(-theta_prime)+dy*sin(-theta_prime);
  const double y_prime2 = -dx*sin(-theta_prime)+dy*cos(-theta_prime);

  //double xx=(double)sin(theta_prime);
  //double yy=(double)sin(-theta_prime);too many balls cos() %g cos(-) %g\n", theta_prime, -theta_prime, xx, yy);


  m_balls[m_numBalls++]=new Ball(b.m_x, b.m_y, b.m_radius, x_prime2, y_prime2, DEFAULT_BALL_COLOR);
  assert (m_numBalls<=MAX_BALLS);
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

  for (int y=0; y<m_height-GFHDR_HEIGHT; y=y+H) {
    for (int x=0; x<m_width; x=x+W*2) {
      if ((y%(H*2))==0) {
        // there is an overloaded version of putImageData() that lets you specify the region that changed
        m_canvas.putImageData(&bitmapDark, x, y+GFHDR_HEIGHT);
        m_canvas.putImageData(&bitmapWhite, x+W, y+GFHDR_HEIGHT);
      }
      else {
        m_canvas.putImageData(&bitmapWhite, x, y+GFHDR_HEIGHT);
        m_canvas.putImageData(&bitmapDark, x+W, y+GFHDR_HEIGHT);
      }
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////


GameField *theField;   // global objects init not implemented (yet)

extern "C" int bounce_balls_init() {

#if 0
  twr_wasm_print_mem_debug_stats();

  if (twr_malloc_unit_test()==0) {
    twr_dbg_printf("twr_malloc_unit_test FAIL\n");
    __builtin_trap();
  }

  twr_dbg_printf("twr_malloc_unit_test PASS\n");

  twr_wasm_print_mem_debug_stats();
#endif

  theField = new GameField();
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move() {
  //time_t start, move, draw, end;

  if (theField->m_numBalls<MAX_BALLS) {
    //time(&start);
    theField->moveBalls();
    //time(&move);

    theField->draw();
    //time(&draw);

    //theField->m_canvas.endDrawSequence();
    //time(&end);

    //twr_dbg_printf("move %dms, draw %dms render %dms\n", move-start, draw-move, end-draw);

  }

  return 0;
}