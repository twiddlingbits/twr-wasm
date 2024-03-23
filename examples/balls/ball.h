#include "canvas.h"

#define PI 3.14159265359
#define MIN_BALL_RADIUS 10
#define MAX_NUM_RADII 25

#define ID_DARKBITMAP 1  // any unique long will do
#define ID_WHITEBITMAP 2
#define ID_GRADIENT 3

#define sq(x) ((x)*(x))

class Ball {  
private:
    static double m_radii[MAX_NUM_RADII];

public:
    static int m_netEntanglements;  // debug
    static int m_numRadii;      // number of ball sizes allowed as computeAllRadii() sets
    static int m_max_mult;    // number of balls max if we start with one ball

    static void computeAllRadii(int largest_radius);
    static bool isOverlap(double ax, double ay, double ar, double bx, double by, double br);
     
public:
    double m_xPxPerMs, m_yPxPerMs;
    double m_x, m_y;
    double m_next_x, m_next_y;
    double m_lostx, m_losty;
    int m_radiiIdx;  // ball size -- starts at zero, increments by 1 until it reaches m_numRadii
    Ball* m_pair;

    Ball(double x, double y, int radiiIdx, double xPxPerMs, double yPxPerMs);           
    void draw(twrCanvas& canvas);
    void move();
    Ball * split();
    double getRadius();
    void clearEntanglements();
    void entanglePair(Ball& a, Ball& b);
    bool isEntangled(Ball& b);
    bool isCollision(Ball &b);
    bool isCollisionNext(Ball &b);
    bool isCollisionNextNext(Ball &b);
    void calcNextPos(double stepTime);

};
