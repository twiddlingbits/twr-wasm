#include "ball.h"

#define MAX_BALLS 150
#define GF_HDR_HEIGHT 30

class GameField  {
  private:
    twrCanvas &m_canvas;    

  public:
    GameField(double ballSpeed);
    void draw();
    void moveAllBalls(double stepTime);
    void moveSingleBall(Ball&b, double stepTime);
    void clearExpiredEntanglements();
    double getFastestBallTime();
    double getAverageBallTime();
    double getLostBallTime();
    void showEntanglements();

    const char* m_backcolor;
    const char* m_forecolor;
    int m_width;
    int m_height;
    int m_num_balls;
    int m_fps;
    int m_minfps;
    int m_ticks_per_interval;
    int m_max_balls;

private:
    void handleWallCollision(int n, double stepTime);
    void handleBallCollisions(int n, int snapNum, double stepTime);
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
