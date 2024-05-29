#include <assert.h>
#include <stdio.h>    //snprintf
#include <stdlib.h>   // rnd, __min
#include <limits.h>   // INT_MAX 
#include <math.h>

#include "gamefield.h"

int testMode=false;

///////////////////////////
// static constructor test
class TestTest {
  public:
  TestTest() {
    twr_conlog("test-test constructor called");
  }
};

static TestTest tt;

/////////////////////////////

GameField::GameField(double ballSpeed) : m_canvas(*(new twrCanvas())) {
  m_backcolor="black"; // black
  m_forecolor="lightgray";
	m_width=d2d_get_canvas_prop("canvasWidth");
	m_height=d2d_get_canvas_prop("canvasHeight");
  const int minDim=__min(m_width, m_height);
  const int r=minDim/5;
  Ball::computeAllRadii(r);
  m_max_balls=__min(Ball::m_max_mult*2, MAX_BALLS);

  m_minfps=INT_MAX;

  m_balls[0]=new Ball(r+10,  m_height/2, 0, ballSpeed, 0);
  m_balls[1]=new Ball(m_width-r-10, m_height/2, 0, -ballSpeed, 0);
  m_num_balls=2;
}

/////////////////////////////

void GameField::draw() {
// note that with twrWasmModuleAsync, it is important to draw the entire frame between startDrawSequence() and endDrawSequence,
// without a flush() (or measureText() which causes a flush ), otherwise you might get a flash.

  //m_canvas.startDrawSequence(5000);
  m_canvas.startDrawSequence();

  m_canvas.setFont("bold 16px monospace");
  m_canvas.setFillStyle(m_backcolor);

  renderTests();

  m_canvas.fillRect(0, 0, m_width, m_height);

  checkerBoard();  // this will overwrite most of above fillRect.  putImageData() doesn't 'respect' the existing canvas alpha

  if (testMode) {
    void drawAsHeart(twrCanvas& canvas, short x, short y);
    drawAsHeart(m_canvas, m_width/2, m_height/2);
  }

  drawBorders();
  drawBallCount();
  drawAllBalls();

  m_canvas.endDrawSequence();
}

/////////////////////////////

void GameField::drawBorders() {
  m_canvas.setFillStyle(m_backcolor);
  m_canvas.setStrokeStyle(m_forecolor);
  m_canvas.setLineWidth(2);
  m_canvas.strokeRect(1, 1, m_width-2, m_height-2);

  m_canvas.beginPath();
  m_canvas.moveTo(0, GF_HDR_HEIGHT);
  m_canvas.lineTo(m_width, GF_HDR_HEIGHT);
  m_canvas.stroke();

  m_canvas.createLinearGradient(ID_HEADER_GRADIENT, m_width*2/3, GF_HDR_HEIGHT/2, m_width-3, GF_HDR_HEIGHT/2);
  m_canvas.addColorStop(ID_HEADER_GRADIENT, 0, "black");
  m_canvas.addColorStop(ID_HEADER_GRADIENT, 1, "gray");
  m_canvas.setFillStyleGradient(ID_HEADER_GRADIENT);
  m_canvas.releaseID(ID_HEADER_GRADIENT);   // releases the internal reference so that JS will garbage collect it when done (above ref released)
  m_canvas.fillRect(m_width*2/3, 3, m_width-3, GF_HDR_HEIGHT-3);
}

/////////////////////////////

void GameField::drawBallCount() {
  static char buf[80];  // Canvas::fillText() does not make a copy of string, and data needs to persist until endDrawSequence() called

  m_canvas.setFillStyle(m_forecolor);
  //snprintf(buf, sizeof(buf), "BALLS: %3d MAX %3d FPS: %3d TICKS: %3d LOST: %3d", m_num_balls, MAX_BALLS, m_fps, m_ticks_per_interval, (int)(getLostBallTime()));
  snprintf(buf, sizeof(buf), "BALLS: %03d of %3d FPS: %03d (min of %d)", m_num_balls, m_max_balls, m_fps, m_minfps);
  m_canvas.fillText(buf, 15, 7);
}

void GameField::drawAllBalls() {
  for (int i=0; i< m_num_balls; i++)
    m_balls[i]->draw(m_canvas);
}

void GameField::renderTests() {
// this sequence is here to test the C++ canvas functions.  they dont do anything useful 
  m_canvas.save();  // functional test of this is in maze
  m_canvas.setFillStyleRGB(0xFF0000);  //red
  m_canvas.restore();

  // next two are here to test the C++ canvas functions.  they don't do anything useful 
  // they are okay here (no flashes in twrWasmModuleAsync) because nothing has been rendered on screen yet.
  m_canvas.flush();  // not needed, just a tiny test of flush()
//  struct d2d_text_metrics tm;
//  m_canvas.measureText("X", &tm);  // functional test of this is in maze
//  twr_conlog("balls tm.width %g", tm.width);
//  twr_conlog("balls tm.fontBoundingBoxAscent %g", tm.fontBoundingBoxAscent);
//  m_canvas.measureText("🎱", &tm);  
//  twr_conlog("🎱balls tm.width %g", tm.width);
//  twr_conlog("🎱balls tm.fontBoundingBoxAscent %g", tm.fontBoundingBoxAscent);
}

/////////////////////////////

double GameField::getFastestBallTime() {
  double max=0;
  for (int i=0; i < m_num_balls; i++) {
    if (max<fabs(m_balls[i]->m_xPxPerMs)) max=fabs(m_balls[i]->m_xPxPerMs);
    if (max<fabs(m_balls[i]->m_yPxPerMs)) max=fabs(m_balls[i]->m_yPxPerMs);
  }
  return max;
}

/////////////////////////////

double GameField::getAverageBallTime() {
  double sum=0;
  for (int i=0; i < m_num_balls; i++) {
    sum=sum+sqrt(sq(m_balls[i]->m_xPxPerMs) + sq(m_balls[i]->m_yPxPerMs));
  }
  return sum/(double)m_num_balls;
}

/////////////////////////////

double GameField::getLostBallTime() {
  double sum=0;
  for (int i=0; i < m_num_balls; i++) {
    sum=sum+sqrt(sq(m_balls[i]->m_lostx) + sq(m_balls[i]->m_losty));
  }
  return sum;
}

/////////////////////////////

void GameField::clearExpiredEntanglements() {
  for (int i=0; i < m_num_balls; i++) 
    for (int j=i+1; j < m_num_balls; j++) 
      if (m_balls[i]->isEntangled(*m_balls[j]))
        if (!Ball::isOverlap(m_balls[i]->m_x, m_balls[i]->m_y, m_balls[i]->getRadius(), m_balls[j]->m_x, m_balls[j]->m_y, m_balls[j]->getRadius()))
          m_balls[i]->clearEntanglements();
}

/////////////////////////////

void GameField::showEntanglements() {
  int numPairs=0;
  int numEntangles=0;
  for (int i=0; i < m_num_balls; i++) {
      if (m_balls[i]->m_pair) numPairs++;
  }

  for (int i=0; i < m_num_balls; i++) 
    for (int j=0; j < m_num_balls; j++) 
      if (i!=j)
        if (m_balls[i]->isEntangled(*m_balls[j]))
          numEntangles++;

  if (numPairs!=numEntangles) twr_conlog("!!!!!!NumPairs!=numEntangles %d %d",numPairs, numEntangles);
  twr_conlog("numPairs==%d",numPairs);
}

/////////////////////////////

#if 0
  static bool sameSign(int a, int b) {
    return (a>0 && b>0) || (a<0 && b<0);
  }
#endif

/////////////////////////////

void GameField::moveAllBalls(double stepTime) {
  assert(stepTime>0);
  
  for (int i=0; i < m_num_balls; i++)
    m_balls[i]->calcNextPos(stepTime);

  const int snapNum=m_num_balls;
  for (int i=0; i < snapNum; i++) {
      // ball can be subject to multiple collisions in each step.  
      handleWallCollision(i, stepTime);
      handleBallCollisions(i, snapNum, stepTime);
    }
   
  for (int i=0; i < snapNum; i++) {
    moveSingleBall(*m_balls[i], stepTime);
  }
}

/////////////////////////////

void GameField::moveSingleBall(Ball& b, double stepTime) {

  if (hitRightEdge(b)) {
    //twr_conlog("can't move. right edge in way.");
    return;
  }

  if (hitLeftEdge(b)) {
    //twr_conlog("can't move. left edge in way.");
    return;
  }

  if (hitBottomEdge(b)) {
    //twr_conlog("can't move. bottom edge in way.");
    return;
  }

  if (hitTopEdge(b)) {
    //twr_conlog("can't move. top edge in way.");
    return;
  }

  for (int i=0; i<m_num_balls; i++) {  // can't move into a position already taken
    if (b.isCollisionNext(*m_balls[i])) {
      b.m_lostx+=fabs(b.m_x-b.m_next_x);
      b.m_losty+=fabs(b.m_y-b.m_next_y);
      return;
    }
  }

  b.move();
}

/////////////////////////////

void GameField::handleWallCollision(int n, double stepTime) {
  Ball &b = *m_balls[n];

  if ( hitRightEdge(b) ) {
    b.m_xPxPerMs = -b.m_xPxPerMs;
    b.m_next_x=b.m_x+b.m_xPxPerMs*stepTime;
  }
  else if ( hitLeftEdge(b) ) {
    b.m_xPxPerMs = -b.m_xPxPerMs;
    b.m_next_x=b.m_x+b.m_xPxPerMs*stepTime;
  }

  if ( hitBottomEdge(b) ) {
    b.m_yPxPerMs = -b.m_yPxPerMs;
    b.m_next_y=b.m_y+b.m_yPxPerMs*stepTime;
  }
  else if ( hitTopEdge(b) ) {
    b.m_yPxPerMs = -b.m_yPxPerMs;
    b.m_next_y=b.m_y+b.m_yPxPerMs*stepTime;
  }
}

bool GameField::hitRightEdge(Ball &b) {
  return b.m_next_x + b.getRadius() >= m_width;
}

bool GameField::hitLeftEdge(Ball &b) {
  return b.m_next_x - b.getRadius() <= 0;
}

bool GameField::hitBottomEdge(Ball &b) {
  return b.m_next_y + b.getRadius() >= m_height;
}

bool GameField::hitTopEdge(Ball &b)  {
  return b.m_next_y - b.getRadius() <= GF_HDR_HEIGHT;
}

/////////////////////////////

void GameField::handleBallCollisions(int n, int snapNum, double stepTime) {
  Ball& bn=*m_balls[n];
  bool hit=false;
  int j;
  for (j=n+1; j < snapNum; j++) {
    //twr_conlog("me ball %d. m_x %g m_y %g m_xPxPerMs %g m_yPxPerMs %g offx %g offy %g", n, bn.m_x, bn.m_y, bn.m_xPxPerMs, bn.m_yPxPerMs, noffx, noffy);

    if (bn.isCollisionNextNext(*m_balls[j])) {
      hit=true;
      break; //!!!!!!!!!!!!!!!!!!!!!!!!!! if this sticks, need to update more code
    }
  }

  // ignores mass differences, this isn't real physics, just a cartoon approximation
  if (hit) {
    Ball& bj=*m_balls[j];
    const double tx=bn.m_xPxPerMs;
    bn.m_xPxPerMs=bj.m_xPxPerMs;
    bj.m_xPxPerMs=tx;

    const double ty=bn.m_yPxPerMs;
    bn.m_yPxPerMs=bj.m_yPxPerMs;
    bj.m_yPxPerMs=ty;

    bj.m_next_x=bj.m_x+bj.m_xPxPerMs*stepTime;
    bj.m_next_y=bj.m_y+bj.m_yPxPerMs*stepTime;

    bn.m_next_x=bn.m_x+bn.m_xPxPerMs*stepTime;
    bn.m_next_y=bn.m_y+bn.m_yPxPerMs*stepTime;

    // occasionally split the ball if it has collided
    // slow down the splits as the number of balls gets larger
    const double base=4;
    double scalePct=base/(double)m_num_balls;
    if (scalePct < .002) scalePct=.002;
    if (scalePct > 1.0) scalePct=1.0;
    if (rand() < (int)((double)RAND_MAX*scalePct)) {
      int bnr=bn.getRadius();
      //!!!! should we split more than one hit ball????
      if (m_num_balls<MAX_BALLS && bn.getRadius()>=bj.getRadius()) {
        splitBall(n);
      }

      if (m_num_balls<MAX_BALLS && bj.getRadius()>=bnr) {
        splitBall(j);
      }
    }
  }
}

/////////////////////////////

Ball * GameField::splitBall(int n) {
  Ball* nb=m_balls[n]->split();
  if (nb) {
    m_balls[m_num_balls++]=nb;
    assert (m_num_balls<=MAX_BALLS);
    assert (nb->m_radiiIdx<nb->m_numRadii);
  }
  return nb;
}

/////////////////////////////

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

extern "C" int bounce_balls_init(double ballSpeed) {

  theField = new GameField(ballSpeed);
  theField->draw();

  return 0;
}

extern "C" int bounce_balls_move(int interval) {
  //time_t start, move, draw, end;
    //time(&start);

  int numTicksPerInterval;  
  if (interval>10)  // 8ms if 125fps, 16ms if 60fps
    numTicksPerInterval=4;  
  else
    numTicksPerInterval=2;  

  double stepTime=(double)interval/(double)numTicksPerInterval;

  theField->m_ticks_per_interval=numTicksPerInterval;
  theField->m_fps=(int)(1000.0/(double)interval);
  theField->m_minfps=__min(theField->m_minfps, theField->m_fps);

  //twr_conlog("fastest ball speed is %g px/sec", 1000*theField->getFastestBallTime());

  if (theField->m_num_balls<theField->m_max_balls) {
    for (int i=0; i<numTicksPerInterval; i++) {
      theField->clearExpiredEntanglements(); // created by ball split, which can happen in handleCollisions()
      theField->moveAllBalls(stepTime);  
    }
    theField->draw();
  }

  return 0;
}