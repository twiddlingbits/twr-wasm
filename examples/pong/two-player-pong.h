#include<canvas.h>
#include "extra.h"

enum class PaddleDir {
   UP,
   STILL,
   DOWN
};

enum class GameState {
   ControlsInit,
   Controls,
   MainGame,
   WinScreenInit,
   WinScreen
};

template<typename T>
struct Vec2D {
   T x, y;
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
   bool intialized = false;

   long l_score = 0;
   long r_score = 0;

   Vec2D<double> l_score_pos;
   Vec2D<double> r_score_pos;
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

   enum GameState game_state;

   bool initialized_win = false;

   long bounce_noise;
   long score_noise;

   CenteredText centered_text;

   

   void renderBackground();
   void renderPaddles();
   void renderStats();
   void renderBall();
   void renderWinScreen();
   void renderControlScreen();
   
   void updatePaddles(double delta);
   void updateBall(double delta);
   
   void updateAI();

   void resetBall();
   void resetGame();

   void ballScored(bool right);

};