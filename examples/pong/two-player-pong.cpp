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
const double PADDLE_SPEED = 100.0;

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
   this->canvas.fillRect(this->height - PADDLE_OFFSET - PADDLE_WIDTH, this->paddleTwo.y, PADDLE_WIDTH, PADDLE_HEIGHT);

}

void TwoPlayerPong::renderBackground() {
   // this->canvas.setFillStyleRGB(0x0FF00);
   // this->canvas.fillRect(0, this->height/2.0 - 5.0, this->width, 10.0);
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

void TwoPlayerPong::updateBall(double delta) {
   double n_x = this->ball.x + this->ball.v_x*delta;
   double n_y = this->ball.y + this->ball.v_y*delta;

   double max_y = this->width - BALL_WIDTH;
   double max_x = this->height - BALL_HEIGHT;

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



   if (
      n_x < PADDLE_OFFSET + PADDLE_WIDTH
      && n_x + BALL_WIDTH > PADDLE_OFFSET
      && n_y + BALL_HEIGHT >= paddleOne.y
      && n_y <= paddleOne.y + PADDLE_HEIGHT
   ) {
      if (this->ball.x >= PADDLE_OFFSET + PADDLE_WIDTH) {
         //hit the front of the paddle
         this->ball.v_x *= -1;
         this->ball.x = PADDLE_OFFSET + PADDLE_WIDTH;
      } else {
         //hit the side of the paddle

         //hit the top of the paddle, lock to top
         if (this->ball.v_y > 1) {
            this->ball.y = paddleOne.y + BALL_HEIGHT;
         } else {
            this->ball.y = paddleOne.y + PADDLE_HEIGHT;
         }
         this->ball.v_y *= -1;
      }
      
      //add paddle velocity to ball
      double paddle_vel = get_paddle_vel(paddleOne);
      this->ball.v_y += paddle_vel;
   }

   if (
      n_x + BALL_WIDTH > this->width - PADDLE_OFFSET - PADDLE_WIDTH
      && n_x + BALL_WIDTH < this->width - PADDLE_OFFSET
      && n_y + BALL_HEIGHT >= paddleTwo.y
      && n_y <= paddleTwo.y + PADDLE_HEIGHT
   ) {
      if (this->ball.x + BALL_WIDTH <= this->width - PADDLE_OFFSET - PADDLE_WIDTH) {
         //hit the front of the paddle
         this->ball.v_x *= -1;
         this->ball.x = this->width - PADDLE_OFFSET - PADDLE_WIDTH - BALL_WIDTH;

      } else {
         //hit the side of the paddle

         //hit the top of the paddle, lock to top
         if (this->ball.v_y > 1) {
            this->ball.y = paddleTwo.y + BALL_HEIGHT;
         } else {
            this->ball.y = paddleTwo.y + PADDLE_HEIGHT;
         }
         this->ball.v_y *= -1;
      }
      
      //add paddle velocity to ball
      double paddle_vel = get_paddle_vel(paddleTwo);
      this->ball.v_y += paddle_vel;

      
   }

   this->ball.x = n_x;
   this->ball.y = n_y;

   // printf("%f, %f\n", this->ball.x, this->ball.y);
}