#include<canvas.h>

enum class PaddleDir {
   UP,
   STILL,
   DOWN
};

struct Paddle {
   PaddleDir dir;
   double y;
};

struct Ball {
   double x, y;
   double v_x, v_y;
};

struct Stats {
   long score;
   long time;
};

class TwoPlayerPong {
   public:
   TwoPlayerPong();
   TwoPlayerPong(double width, double height, bool hasAI);
   TwoPlayerPong& operator=(const TwoPlayerPong& copy);

   void render();
   void tick(long time);

   void keyDownEvent(long keycode);
   void keyUpEvent(long keycode);


   private:
   double width;
   double height;

   bool hasAI;

   twrCanvas canvas;

   Paddle paddleOne;
   Paddle paddleTwo;
   Ball ball;
   
   Stats stats;

   double last_time = -1.0;

   

   void renderBackground();
   void renderPaddles();
   void renderStats();
   void renderBall();
   
   void updatePaddles(double delta);
   void updateBall(double delta);
   
   void updateAI();

   void resetGame();

};