#include "two-player-pong.h"
#include<time.h>
#include<stdlib.h>
#include <math.h>
#include "twr-audio.h"

#include "extra.h"

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




const double CENTERED_TEXT_VERTICAL_OFFSET = 20.0;
TwoPlayerPong::TwoPlayerPong() {
   this->width = 0.0;
   this->height = 0.0;
   this->hasAI = false;
}

TwoPlayerPong::TwoPlayerPong(double width, double height, bool hasAI) {
   this->width = width;
   this->height = height;
   this->hasAI = hasAI;
   this->bounce_noise = load_square_wave(493.883, 0.05, 48000);
   this->score_noise = load_square_wave(440, 0.05, 48000);
   this->centered_text = CenteredText(0.0, 0.0, this->width, this->height, CENTERED_TEXT_VERTICAL_OFFSET);
   srand(time(NULL));

   this->resetGame();
}

TwoPlayerPong& TwoPlayerPong::operator=(const TwoPlayerPong& copy) {
   this->width = copy.width;
   this->height = copy.height;
   this->hasAI = copy.hasAI;
   this->bounce_noise = copy.bounce_noise;
   this->score_noise = copy.score_noise;

   this->centered_text = CenteredText(0.0, 0.0, this->width, this->height, CENTERED_TEXT_VERTICAL_OFFSET);

   this->resetGame();

   return *this;
}


void TwoPlayerPong::resetBall() {
   this->ball.x = (this->width - BALL_WIDTH)/2.0;
   this->ball.y = (this->height - BALL_HEIGHT)/2.0;

   const double start_speed = 200.0;
   //only allow ball to spawn in 60 degree cone in either direction
   double start_part = rand()%60;
   double dir = rand()%2; //o or 1; 0 is right, 1 is left
   double start_dir = (180 - start_part) - 180*dir;
   double start_dir_rad = start_dir * M_PI/180;

   this->ball.v_x = start_speed*cos(start_dir_rad);
   this->ball.v_y = start_speed*sin(start_dir_rad);
}
void TwoPlayerPong::resetGame() {
   this->resetBall();

   this->paddleOne.dir = PaddleDir::STILL;
   this->paddleOne.y = (this->height - PADDLE_HEIGHT)/2.0;

   this->paddleTwo.dir = PaddleDir::STILL;
   this->paddleTwo.y = (this->height - PADDLE_HEIGHT)/2.0;

   this->last_time = -1.0;

   this->stats.l_score = 0;
   this->stats.r_score = 0;

   this->initialized_win = false;

   game_state = GameState::ControlsInit;
}


void TwoPlayerPong::render() {
   this->canvas.startDrawSequence();

   this->canvas.reset();
   this->canvas.setFillStyleRGB(0x000000);
   this->canvas.fillRect(0, 0, this->width, this->height);

   this->renderStats();
   this->renderBackground();
   this->renderBall();
   this->renderPaddles();
   

   switch (this->game_state) {
      case GameState::ControlsInit:
      case GameState::Controls:
      {
         this->renderControlScreen();
      }
      break;

      case GameState::MainGame:
      {
         //do nothing special
      }
      break;
      
      case GameState::WinScreenInit:
      case GameState::WinScreen:
      {
         this->renderWinScreen();
      }
      break;
   }

   this->canvas.endDrawSequence();
}

void TwoPlayerPong::renderControlScreen() {
   if (this->game_state == GameState::ControlsInit) {
      this->game_state = GameState::Controls;

      this->centered_text.clearText();
      const char* instruciton_font = "32px Seriph";
      const colorRGBA_t color = 0xFFFFFFFF;
      const colorRGBA_t background_color = 0x000000FF;
      const double border = 5.0;
      if (this->hasAI) {
         this->centered_text.addText("Use the up and down arrows", instruciton_font, color, background_color, border);
         this->centered_text.addText("or use w and s to move the paddle", instruciton_font, color, background_color, border);
      } else {
         this->centered_text.addText("Use w and s to move the left paddle", instruciton_font, color, background_color, border);
         this->centered_text.addText("Use the up arrow and down arrow to move the right paddle", instruciton_font, color, background_color, border);
      }
      this->centered_text.addText("Press Enter to Start", "24px Seriph", color, background_color, 3.0);
   }

   this->centered_text.render(this->canvas);
}

void TwoPlayerPong::renderStats() {

   this->canvas.setFillStyleRGBA(0xFFFFFFA0);
   this->canvas.setFont("25px Seriph");

   if (!this->stats.intialized) {
      const double x_off = 20.0;
      const double y_off = 20.0;

      d2d_text_metrics l_score;
      this->canvas.measureText("0000", &l_score);

      this->stats.l_score_pos.x = x_off;
      this->stats.l_score_pos.y = y_off + l_score.actualBoundingBoxAscent - l_score.actualBoundingBoxDescent;

      d2d_text_metrics r_score;
      this->canvas.measureText("0000", &r_score);

      this->stats.r_score_pos.x = this->width - r_score.width - x_off;
      this->stats.r_score_pos.y = y_off + r_score.actualBoundingBoxAscent - r_score.actualBoundingBoxDescent;
      

      // printf("hi!!! %f, %f\n", this->stats.score_x, this->stats.score_y);
      this->stats.intialized = true;
   }

   const int score_len = 20;
   char l_score_str[score_len];

   snprintf(l_score_str, score_len-1, "% 4ld", this->stats.l_score);
   this->canvas.fillText(l_score_str, this->stats.l_score_pos.x, this->stats.l_score_pos.y);


   char r_score_str[score_len];

   snprintf(r_score_str, score_len-1, "%ld", this->stats.r_score);
   this->canvas.fillText(r_score_str, this->stats.r_score_pos.x, this->stats.r_score_pos.y);


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
   
   //paddles can move during any game state, but the ball may only update during gameplay
   this->updatePaddles(s_delta);
   if (this->game_state == GameState::MainGame)
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

      case KeyCode::enter:
         if(game_state == GameState::WinScreen || game_state == GameState::WinScreenInit)
            this->resetGame();
         else if (game_state == GameState::Controls || game_state == GameState::ControlsInit)
            this->game_state = GameState::MainGame; //start game

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


const double BALL_BOUNCE_VOL = 2.0;
void paddleCollision(Ball& ball, double& n_x, double& n_y, Paddle& paddle, double paddle_x, long bounce_noise){

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

      twr_audio_play_volume(bounce_noise, BALL_BOUNCE_VOL, 0.0);
      
      //add paddle velocity to ball
      double paddle_vel = get_paddle_vel(paddle);
      ball.v_y += paddle_vel;

      //reflect at an angle represented by circle around paddle
      double paddle_angle = atan2(ball_middle - paddle_middle, ball_middle_x - paddle_middle_x);
      
      double ball_angle = atan2(ball.v_y, ball.v_x);

      double ball_speed = sqrt(ball.v_x*ball.v_x + ball.v_y*ball.v_y);

      double new_angle = ball_angle + (paddle_angle - ball_angle) * 0.01;

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
      twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
   } else if (n_y > max_y) {
      //bounce off bottom wall by flipping y direction
      //interpolate to add the extra y back in the opposite direction

      //max_y - (n_y - max_y) = max_y + max_y - n_y = 2*max_y - n_y
      n_y = 2*max_y - n_y;
      this->ball.v_y *= -1;
      twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
   }

   if (n_x < 0) { //hit left
      this->ballScored(false);
      twr_audio_play(this->score_noise);
      return;
   } else if (n_x > max_x) {
      this->ballScored(true);
      twr_audio_play(this->score_noise);
      return;
   }


   //left paddle
   paddleCollision(this->ball, n_x, n_y, paddleOne, PADDLE_OFFSET, this->bounce_noise);

   //right paddle
   paddleCollision(this->ball, n_x, n_y, paddleTwo, this->width - PADDLE_OFFSET - PADDLE_WIDTH, this->bounce_noise);

   this->ball.x = n_x;
   this->ball.y = n_y;

   // printf("%f, %f\n", this->ball.x, this->ball.y);
}

void TwoPlayerPong::ballScored(bool right) {
   int changed_score = 0;
   if (right) {
      this->stats.l_score += 1;
      changed_score = this->stats.l_score;
   } else {
      this->stats.r_score += 1;
      changed_score = this->stats.r_score;
   }

   const int WINNING_SCORE = 10;

   if (changed_score >= WINNING_SCORE) {
      this->game_state = GameState::WinScreenInit;
   } else {
      this->resetBall();
   }
}

void fillBorderedText(twrCanvas & canvas, const char* text, double x, double y, double outer_width) {
   canvas.save();
   canvas.setLineWidth(outer_width);
   canvas.setStrokeStyleRGB(0xFFFFFF);
   canvas.strokeText(text, x, y);

   canvas.restore();
   canvas.fillText(text, x, y);
}

void TwoPlayerPong::renderWinScreen() {

   this->canvas.setLineDash(0, NULL);

   
   if (this->game_state == GameState::WinScreenInit) {
      this->game_state = GameState::WinScreen;

      const int winner_len = 22;
      char winner_str[winner_len] = {0};
      snprintf(winner_str, winner_len - 1, "%s is the winner!", this->stats.l_score < this->stats.r_score ? "Right" : "Left");

      //setup centered text renderer
      this->centered_text.clearText();
      this->centered_text.addText(winner_str, "48px Seriph", 0x00FF00FF, 0xFFFFFFFF, 5.0);
      this->centered_text.addText("Press Enter to Play Again", "32px Seriph", 0xFF0000FF, 0xFFFFFFFF, 3.0);
   }

   this->centered_text.render(this->canvas);

}