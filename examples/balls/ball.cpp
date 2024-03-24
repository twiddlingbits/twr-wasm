#include <assert.h>
#include <math.h>

#include "ball.h"

///////////////////////

int Ball::m_netEntanglements;  // debug
int Ball::m_max_mult;    // number of balls max if we start with one ball
int Ball::m_numRadii;
double Ball::m_radii[MAX_NUM_RADII];

///////////////////////

Ball::Ball(double x, double y, int radiiIdx, double xPxPerMs, double yPxPerMs)  {
  assert(radiiIdx<m_numRadii);

  m_x=x;
  m_y=y;
  m_lostx=0;
  m_losty=0;
  m_xPxPerMs=xPxPerMs;
  m_yPxPerMs=yPxPerMs;
  m_radiiIdx=radiiIdx;
  m_pair=NULL;
}

///////////////////////

void Ball::computeAllRadii(int largest_radius) {
  int n=0;
  m_max_mult=1;  // number of balls max if we start with one ball
  double r=largest_radius;
  while (r>MIN_BALL_RADIUS) {
    m_radii[n++]=r;
    assert(n<=MAX_NUM_RADII);
    r=r*.707;
    if (n>1) m_max_mult=m_max_mult*2;
  }
  
  m_numRadii=n;
}

///////////////////////

double Ball::getRadius() {
  //assert(m_numRadii<=MAX_NUM_RADII);
  return m_radii[m_radiiIdx];
}

///////////////////////

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

///////////////////////

bool Ball::isOverlap(double ax, double ay, double ar, double bx, double by, double br) {
  const double distancesq= sq(ax-bx) + sq(ay-by);
  const bool ov = sq(ar+br) > distancesq;
  //twr_dbg_printf("isOverlap %s %g %g %g : %g %g %g\n", dbg, ax, ay, ar, bx, by, br);
  return ov;
}

bool Ball::isCollision(Ball &b) {
  if (this==&b || isEntangled(b)) return false;
  return isOverlap(this->m_x, this->m_y, this->getRadius(), b.m_x, b.m_y, b.getRadius());
}

bool Ball::isCollisionNext(Ball &b) {
  if (this==&b || isEntangled(b)) return false;
  return isOverlap(this->m_next_x, this->m_next_y, this->getRadius(), b.m_x, b.m_y, b.getRadius());
}

bool Ball::isCollisionNextNext(Ball &b) {
  if (this==&b || isEntangled(b)) return false;
  return isOverlap(this->m_next_x, this->m_next_y, this->getRadius(), b.m_next_x, b.m_next_y, b.getRadius());
}

///////////////////////


void Ball::calcNextPos(double stepTime) {
  m_next_x=m_x+m_xPxPerMs*stepTime;
  m_next_y=m_y+m_yPxPerMs*stepTime;
  //assert(fabs(m_xPxPerMs)*stepTime <= 1);
  //assert(fabs(m_yPxPerMs)*stepTime <= 1);
}

///////////////////////

void Ball::move() {
  m_x=m_next_x;
  m_y=m_next_y;
}

///////////////////////

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

///////////////////////

// when balls split, they are entangled until they separate
bool Ball::isEntangled(Ball& b) {
  assert(this!=&b);
  return this->m_pair==&b && b.m_pair==this;
}

///////////////////////

void Ball::clearEntanglements() {
  assert(this->m_pair!=this);
  assert(this->m_pair && this->m_pair->m_pair==this);
  m_netEntanglements--;
  //twr_dbg_printf("m_netEntanglements %d\n", m_netEntanglements);
  this->m_pair->m_pair=NULL;
  this->m_pair=NULL;
}

///////////////////////

void Ball::entanglePair(Ball& a, Ball& b) {
  assert(a.m_pair==NULL && b.m_pair==NULL);
  assert(&a!=&b);
  m_netEntanglements++;
  //twr_dbg_printf("m_netEntanglements %d\n", m_netEntanglements);
  a.m_pair=&b;
  b.m_pair=&a;
}

