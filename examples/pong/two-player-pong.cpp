#include "two-player-pong.h"
#include<time.h>
#include<stdlib.h>
#include <math.h>

#define M_PI 3.14159265358979323846

const double BALL_WIDTH = 25.0;
const double BALL_HEIGHT = 25.0;

const double PADDLE_HEIGHT = 100.0;
const double PADDLE_WIDTH = 20.0;
const double PADDLE_OFFSET = 10.0;
const double PADDLE_SPEED = 150.0;

const colorRGB_t BALL_COLOR = 0xFFFFFF;
const colorRGB_t PADDLE_ONE_COLOR = 0xFFFFFF;
const colorRGB_t PADDLE_TWO_COLOR = 0xFFFFFF;

TwoPlayerPong::TwoPlayerPong() {
   this->width = 0.0;
   this->height = 0.0;
   this->hasAI = false;
}

TwoPlayerPong::TwoPlayerPong(double width, double height, bool hasAI) {
   this->width = width;
   this->height = height;
   this->hasAI = hasAI;

   srand(time(NULL));

   this->resetGame();
}

TwoPlayerPong& TwoPlayerPong::operator=(const TwoPlayerPong& copy) {
   this->width = copy.width;
   this->height = copy.height;
   this->hasAI = copy.hasAI;

   this->resetGame();

   return *this;
}


void TwoPlayerPong::resetGame() {
   this->ball.x = (this->width - BALL_WIDTH)/2.0;
   this->ball.y = (this->height - BALL_HEIGHT)/2.0;

   const double start_speed = 200.0;
   double start_dir = rand()%360;
   double start_dir_rad = start_dir * M_PI/180;

   this->ball.v_x = start_speed*cos(start_dir_rad);
   this->ball.v_y = start_speed*sin(start_dir_rad);


   this->paddleOne.dir = PaddleDir::STILL;
   this->paddleOne.y = (this->height - PADDLE_HEIGHT)/2.0;

   this->paddleTwo.dir = PaddleDir::STILL;
   this->paddleTwo.y = (this->height - PADDLE_HEIGHT)/2.0;

   this->last_time = -1.0;
}


void TwoPlayerPong::render() {
   this->canvas.startDrawSequence();

   this->canvas.setFillStyleRGB(0x000000);
   this->canvas.fillRect(0, 0, this->width, this->height);

   this->renderBackground();
   this->renderBall();
   this->renderPaddles();

   this->canvas.endDrawSequence();
}


void TwoPlayerPong::renderBall() {
   this->canvas.setFillStyleRGB(BALL_COLOR);
   this->canvas.fillRect(this->ball.x, this->ball.y, BALL_WIDTH, BALL_HEIGHT);
}

void TwoPlayerPong::renderPaddles() {
   this->canvas.setFillStyleRGB(PADDLE_ONE_COLOR);
   this->canvas.fillRect(PADDLE_OFFSET, this->paddleOne.y, PADDLE_WIDTH, PADDLE_HEIGHT);

   this->canvas.setFillStyleRGB(PADDLE_TWO_COLOR);
   this->canvas.fillRect(this->width - PADDLE_OFFSET - PADDLE_WIDTH, this->paddleTwo.y, PADDLE_WIDTH, PADDLE_HEIGHT);

}

void TwoPlayerPong::renderBackground() {
   // this->canvas.setFillStyleRGB(0x0FF00);
   // this->canvas.fillRect(0, this->height/2.0 - 5.0, this->width, 10.0);
   this->canvas.setStrokeStyleRGBA(0xFFFFFFA0);

   this->canvas.setLineWidth(10.0);

   const long NUM_DASHES = 15;
   double dash_len = this->height/(NUM_DASHES * 2.0);

   this->canvas.setLineDash(1, &dash_len);
   this->canvas.setLineDashOffset(dash_len/2.0);

   this->canvas.beginPath();
   this->canvas.moveTo(this->width/2.0, 0.0);
   this->canvas.lineTo(this->width/2.0, this->height);
   this->canvas.stroke();
}

void TwoPlayerPong::tick(long time) {
   double s_time = (double)time/1000.0; //converting time to seconds
   double s_delta = last_time < 0 ? 0 : (double)s_time - last_time; //getting delta in seconds
   last_time = s_time; //setting last time to current one
   
   this->updatePaddles(s_delta);
   this->updateBall(s_delta);
   this->updateAI();
   
}

void TwoPlayerPong::updateAI() {
   if (!this->hasAI) return;

   double center_y = this->paddleTwo.y + PADDLE_HEIGHT/2.0;

   if (center_y > this->ball.y) {
      this->paddleTwo.dir = PaddleDir::UP;
   } else if (center_y < this->ball.y) {
      this->paddleTwo.dir = PaddleDir::DOWN;
   } else {
      this->paddleTwo.dir = PaddleDir::STILL;
   }
}


void updatePaddle(Paddle& paddle, double height, double delta) {
   switch (paddle.dir) {
      case PaddleDir::UP:
      {
         if (paddle.y > 0) {
            paddle.y -= PADDLE_SPEED * delta;
            if (paddle.y < 0) paddle.y = 0;
         }
      }
      break;

      case PaddleDir::DOWN:
      {
         double max_y = height - PADDLE_HEIGHT;
         if (paddle.y < max_y) {
            paddle.y += PADDLE_SPEED * delta;
            if (paddle.y > max_y) paddle.y = max_y;
         }
      }
      break;

      default:
      break;
   }
}
void TwoPlayerPong::updatePaddles(double delta) {
   updatePaddle(this->paddleOne, this->height, delta);
   updatePaddle(this->paddleTwo, this->height, delta);
}

enum class KeyCode {
   ArrowUp = 8593,
   ArrowDown = 8595,
   w = 119,
   s = 115,
   enter = 10,
};

void TwoPlayerPong::keyDownEvent(long keycode) {
   switch ((KeyCode)keycode) {
      case KeyCode::ArrowUp:
         if (this->hasAI) {
            paddleOne.dir = PaddleDir::UP;
         } else {
            paddleTwo.dir = PaddleDir::UP;
         }
      break;

      case KeyCode::ArrowDown:
         if (this->hasAI) {
            paddleOne.dir = PaddleDir::DOWN;
         } else {
            paddleTwo.dir = PaddleDir::DOWN;
         }
      break;

      case KeyCode::w:
         paddleOne.dir = PaddleDir::UP;
      break;

      case KeyCode::s:
         paddleOne.dir = PaddleDir::DOWN;
      break;

      default:
      break;
   }
}

void unpressPaddleKey(Paddle &paddle, PaddleDir dir) {
   if (paddle.dir == dir) {
      paddle.dir = PaddleDir::STILL;
   }
}
void TwoPlayerPong::keyUpEvent(long keycode) {
   switch ((KeyCode)keycode) {
      case KeyCode::ArrowUp:
         if (this->hasAI) {
            unpressPaddleKey(this->paddleOne, PaddleDir::UP);
         } else {
            unpressPaddleKey(this->paddleTwo, PaddleDir::UP);
         }
      break;

      case KeyCode::ArrowDown:
         if (this->hasAI) {
            unpressPaddleKey(this->paddleOne, PaddleDir::DOWN);
         } else {
            unpressPaddleKey(this->paddleTwo, PaddleDir::DOWN);
         }
      break;

      case KeyCode::w:
         unpressPaddleKey(this->paddleOne, PaddleDir::UP);
      break;

      case KeyCode::s:
         unpressPaddleKey(this->paddleOne, PaddleDir::DOWN);
      break;

      default:
      break;
   }
}

double get_paddle_vel(Paddle &paddle) {
   switch (paddle.dir) {
      case PaddleDir::UP:
         return -PADDLE_SPEED*0.1;
      case PaddleDir::DOWN:
         return PADDLE_SPEED*0.1;
      case PaddleDir::STILL:
         return 0.0;
   }
}

template<typename T>
T better_abs(T val) {
   if (val < 0) {
      return -val;
   } else {
      return val;
   }
}

extern "C" {
   __attribute__((import_name("atan2")))
   void atan2(double y, double x, double* ret);
}


void paddleCollision(Ball& ball, double& n_x, double& n_y, Paddle& paddle, double paddle_x){

   double paddle_middle = paddle.y + PADDLE_HEIGHT/2.0;
   double ball_middle = ball.y + BALL_HEIGHT/2.0;

   double paddle_middle_x = paddle_x + PADDLE_WIDTH/2.0;
   double ball_middle_x = ball.x + BALL_WIDTH/2.0;

   if (
      paddle_x <= n_x + BALL_HEIGHT
      && paddle_x + PADDLE_WIDTH >= n_x
      && paddle.y <= n_y + BALL_HEIGHT
      && paddle.y + PADDLE_HEIGHT >= n_y
   ) {
      if (ball.x + BALL_WIDTH <= paddle_x) { //hit left side
         ball.v_x = -better_abs(ball.v_x);
         n_x = paddle_x - BALL_WIDTH;
      } else if (ball.x >= paddle_x + PADDLE_WIDTH) { //hit right side
         ball.v_x = better_abs(ball.v_x);
         n_x = paddle_x + PADDLE_WIDTH;
      } else if (ball_middle - paddle_middle < 0) { //hit the top
         n_y = paddle.y - BALL_HEIGHT;
         ball.v_y = -better_abs(ball.v_y);
      } else { //hit the bottom
         n_y = paddle.y + PADDLE_HEIGHT;
         ball.v_y = better_abs(ball.v_y);
      }
      
      //add paddle velocity to ball
      double paddle_vel = get_paddle_vel(paddle);
      ball.v_y += paddle_vel;

      //reflect at an angle represented by circle around paddle
      double paddle_angle;
      atan2(ball_middle - paddle_middle, ball_middle_x - paddle_middle_x, &paddle_angle);
      
      double ball_angle;
      atan2(ball.v_y, ball.v_x, &ball_angle);

      double ball_speed = sqrt(ball.v_x*ball.v_x + ball.v_y*ball.v_y);

      double new_angle = ball_angle + (paddle_angle - ball_angle) * 0.2;

      ball.v_x = ball_speed * cos(new_angle);
      ball.v_y = ball_speed * sin(new_angle);

   }
}
void TwoPlayerPong::updateBall(double delta) {
   double n_x = this->ball.x + this->ball.v_x*delta;
   double n_y = this->ball.y + this->ball.v_y*delta;

   double max_x = this->width - BALL_WIDTH;
   double max_y = this->height - BALL_HEIGHT;

   if (n_y < 0) {
      //bounce off top wall by flipping y direction
      //interpolate to add the extra y back in th eopposite direction
      n_y = 0 - n_y;
      this->ball.v_y *= -1;
   } else if (n_y > max_y) {
      //bounce off bottom wall by flipping y direction
      //interpolate to add the extra y back in the opposite direction

      //max_y - (n_y - max_y) = max_y + max_y - n_y = 2*max_y - n_y
      n_y = 2*max_y - n_y;
      this->ball.v_y *= -1;
   }

   if (n_x < 0) {
      n_x = 0 - n_x;
      this->ball.v_x *= -1;
   } else if (n_x > max_x) {

      n_x = 2*max_x - n_x;
      this->ball.v_x *= -1;
   }


   //left paddle
   paddleCollision(this->ball, n_x, n_y, paddleOne, PADDLE_OFFSET);

   //right paddle
   paddleCollision(this->ball, n_x, n_y, paddleTwo, this->width - PADDLE_OFFSET - PADDLE_WIDTH);

   this->ball.x = n_x;
   this->ball.y = n_y;

   // printf("%f, %f\n", this->ball.x, this->ball.y);
}