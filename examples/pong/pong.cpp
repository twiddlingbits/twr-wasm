#include "pong.h"
#include "twr-audio.h"

#include "extra.h"

#define M_PI 3.14159265358979323846


void Pong::endGame() {
    this->game_running = false;
}
void Pong::resetGame() {
    this->ball_x = this->width/2.0 - this->ball_size/2.0;
    this->ball_y = this->height/2.0 - this->ball_size/2.0;

    this->paddle_x = this->width/2.0 - this->paddle_width/2.0;

    const double start_speed = 200.0/1000.0;
    double start_dir = rand()%90 - 90;
    double start_dir_rad = start_dir * M_PI/180;

    this->ball_velocity_x = start_speed*cos(start_dir_rad);
    this->ball_velocity_y = start_speed*sin(start_dir_rad);
    this->game_running = true;
    this->run_time = 0;
    this->score = 0;
    this->last_timestamp = 0;
}
Pong::Pong() {}

Pong::Pong(double width, double height, colorRGB_t border_color, colorRGB_t background_color, colorRGB_t paddle_color, colorRGB_t ball_color) {
    this->width = width;
    this->height = height;
    this->border_color = border_color;
    this->background_color = background_color;
    this->paddle_color = paddle_color;
    this->ball_color = ball_color;

    this->bounce_noise = load_square_wave(493.883, 0.05, 48000);
    this->lose_noise = load_square_wave(440, 0.25, 48000);

    #ifdef ASYNC
    bool image_loaded = d2d_load_image("https://images.pexels.com/photos/235985/pexels-photo-235985.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", background_image_id);
    assert(image_loaded);
    #endif
    //initialized random number generator
    
    srand(twr_epoch_timems());

    this->resetGame();
}
Pong& Pong::operator=(const Pong& copy) {
   this->width = copy.width;
    this->height = copy.height;
    this->border_color = copy.border_color;
    this->background_color = copy.background_color;
    this->paddle_color = copy.paddle_color;
    this->ball_color = copy.ball_color;

    this->bounce_noise = copy.bounce_noise;
    this->lose_noise = copy.lose_noise;

    this->resetGame();

    return *this;
}

void Pong::render() {
    this->canvas.startDrawSequence();
    this->canvas.reset();
    this->canvas.setLineCap("round");
    this->canvas.setLineJoin("round");
    this->canvas.setFillStyleRGB(this->background_color);
    this->canvas.fillRect(0.0, 0.0, this->width, this->height);
    this->renderBackground();
    this->renderStats();
    this->renderBorder();
    this->renderBall();
    this->renderPaddle();
    if (!this->game_running) {
        this->renderEndGame();
    }
    this->canvas.endDrawSequence();
}
void Pong::renderBackground() {
   #ifdef ASYNC
   this->canvas.drawImage(background_image_id, 0, 0, this->width, this->height, 0, 0, 0, 0);
   #endif


   this->canvas.save();

   this->canvas.beginPath();
   const long segment_len2 = 1;
   double segments[segment_len2] = {20};
   this->canvas.setLineDash(segment_len2, segments);
   this->canvas.setLineWidth(10.0);
   const long offset_max = 40;
   const long offset_divisor = 10;
   if (this->ball_velocity_x > 0) {
      this->canvas.setLineDashOffset(offset_max - (this->last_timestamp/offset_divisor)%offset_max);
   } else {
      this->canvas.setLineDashOffset((this->last_timestamp/offset_divisor)%offset_max);
   }
   
   this->canvas.setStrokeStyleRGB(0xE0E0E0);
   this->canvas.moveTo(0.0, this->height);
   this->canvas.quadraticCurveTo(this->height/2.0, this->width - this->paddle_offset, this->width, this->height);
   this->canvas.stroke();

   this->canvas.restore();

   this->canvas.beginPath();
   this->canvas.setStrokeStyleRGBA(0xE0E0E040);
   this->canvas.moveTo(0, 0);
   const double p1_x = this->width/2.0;
   const double p1_y = this->height/4.0 * 3.0;
   const double radius = 360.0;
   this->canvas.arcTo(p1_x, p1_y, 0.0, this->height, radius);
   this->canvas.moveTo(this->width, 0.0);
   this->canvas.arcTo(p1_x, p1_y, this->width, this->height, radius);
   this->canvas.stroke();
}
void Pong::renderBorder() {
   this->canvas.setLineWidth(this->border_width);
   double offset = this->border_width/2.0;

   //clear anything on the outer edges of the rounded corners
   this->canvas.setStrokeStyleRGB(this->background_color);
   this->canvas.strokeRect(offset - 1, offset - 1, this->width - this->border_width + 2, this->height - this->border_width + 2);
   //clear everything outside to the right of the border (for when canvas is larger than play area)
   this->canvas.setFillStyleRGB(this->background_color);
   this->canvas.fillRect(this->width, 0.0, 200.0, this->height);
   
   this->canvas.setStrokeStyleRGB(this->border_color);
   this->canvas.beginPath();
   this->canvas.roundRect(offset, offset, this->width - this->border_width, this->height - this->border_width, 20.0);
   this->canvas.stroke();

}
void Pong::renderBall() {

   this->canvas.translate(this->ball_x, this->ball_y);

   this->canvas.setFillStyleRGB(this->ball_color);
   this->canvas.setLineWidth(2.0);
   this->canvas.beginPath();
   this->canvas.moveTo(this->ball_size/2.0, 0);
   this->canvas.lineTo(this->ball_size, this->ball_size);
   this->canvas.lineTo(0, this->ball_size);
   //this->canvas.lineTo(this->ball_x + this->ball_size/2.0, this->ball_y);
   this->canvas.closePath();
   this->canvas.fill();

   double angle = 45 * M_PI/180;
   this->canvas.translate(this->ball_size/2.0, this->ball_size/4.0 * 3);
   this->canvas.rotate(angle);

   this->canvas.resetTransform();
}
void Pong::renderPaddle() {
    this->canvas.setFillStyleRGB(this->paddle_color);
    this->canvas.translate(this->paddle_x, this->height - this->paddle_offset);
    this->canvas.beginPath();
    this->canvas.rect(0, 0, this->paddle_width, this->paddle_height);
    this->canvas.fill();
    this->canvas.resetTransform();
}
void Pong::renderStats() {
    const int score_len = 20;
    char text[score_len] = {0};
    snprintf(text, score_len-1, "Score: %d", this->score);

    this->canvas.setLineWidth(1.5);
    const char * stat_font = "20px serif";
    this->canvas.setFont(stat_font);
    #ifdef ASYNC
    this->canvas.setFillStyleRGB(0xededed);
    #else
    this->canvas.setFillStyleRGB(0x000000);
    #endif
    this->canvas.fillText(text, 30.0, 30.0);

    long minutes = (this->run_time/1000)/60;
    long seconds = (this->run_time/1000)%60;

    const int time_len = 14;
    char time[score_len] = {0};
    snprintf(time, time_len-1, "Time: %02ld:%02ld", minutes, seconds);
    this->canvas.fillText(time, this->width - 150.0, 30.0);
    // this->strokeBorderedText(text, this->width - 150.0, 30.0, 2.0);

    this->canvas.beginPath();
    if (this->last_timestamp - this->score_time <= this->score_green_time) {
        this->canvas.setStrokeStyleRGB(0x00FF00);
    } else {
        this->canvas.setStrokeStyleRGBA(0xF0F0F0A0);
    }
    this->canvas.setLineWidth(4.0);
    this->canvas.ellipse(70.0, 25.0, 60.0, 15.0, 0, 0, M_PI*2);
    this->canvas.stroke();
}

template <typename T>
T better_abs(T a) {
    if (a < 0) {
        return -a;
    } else {
        return a;
    }
}
void Pong::renderEndGame() {
    const char * game_font = "48px serif";
    const char * restart_font = "30px serif";
    const colorRGB_t text_color = 0xFF0000;

    const char * game = "Game Over!";
    const char * restart = "Press Enter to Restart";

    this->canvas.setFont(game_font);
    d2d_text_metrics game_metrics;
    this->canvas.measureText(game, &game_metrics);

    this->canvas.setFont(restart_font);
    d2d_text_metrics restart_metrics;
    this->canvas.measureText(restart, &restart_metrics);

    const double offset = 10.0;

    double game_height = better_abs(game_metrics.actualBoundingBoxDescent - game_metrics.actualBoundingBoxAscent);
    double restart_height = better_abs(restart_metrics.actualBoundingBoxDescent - restart_metrics.actualBoundingBoxAscent);

    double total_height = game_height + offset + restart_height;

    double game_y = (this->height - total_height)/2.0;
    double game_x = (this->width - game_metrics.width)/2.0;
    double restart_y = game_y + game_height + offset;
    double restart_x = (this->width - restart_metrics.width)/2.0;

    this->canvas.setFillStyleRGB(text_color);

    this->canvas.setFont(game_font);
    // this->canvas.fillText(game, game_x, game_y);
    this->fillBorderedText(game, game_x, game_y, 10.0);

    this->canvas.setFont(restart_font);
    // this->canvas.fillText(restart,restart_x, restart_y);
    this->fillBorderedText(restart, restart_x, restart_y, 3.0);
}
void Pong::tick(long time) {
    if (this->last_timestamp == 0) {
        this->last_timestamp = time;
        return;
    } else if (!game_running) {
        return;
    }
    long delta = time - this->last_timestamp;
    this->last_timestamp = time;
     
    this->tickBall(delta);
    this->tickPaddle(delta);

    this->run_time += delta;
}
const double BALL_BOUNCE_VOL = 2.0;
void Pong::tickBall(long delta) {
    double prev_y = this->ball_y;
    this->ball_x += this->ball_velocity_x * delta;
    this->ball_y += this->ball_velocity_y * delta;

    
    if (this->ball_x <= this->border_width) { //left wall
        this->ball_x = this->border_width;
        this->ball_velocity_x *= -1;
        twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
    } else if (this->ball_x >= this->width - this->ball_size - this->border_width) { //right wall
        this->ball_x = this->width - this->ball_size - this->border_width;
        this->ball_velocity_x *= -1;
        twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
    } 
    
    //x and y are seperate checks for the corner case
    if (this->ball_y <= border_width) { //top wall
        this->ball_y = this->border_width;
        this->ball_velocity_y *= -1;
        twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
    } else if (this->ball_y >= this->height - this->ball_size - this->border_width) { //bottom wall, lost game
        this->ball_y = this->height - this->ball_size - this->border_width - 1.0;
        twr_audio_play(this->lose_noise);
        this->endGame();
    }

    //paddle hits
    double paddle_top = this->height - this->paddle_offset;
    double paddle_bottom = paddle_top + this->paddle_height;
    double paddle_left = this->paddle_x;
    double paddle_right = paddle_left + this->paddle_width;
    
    double ball_top = this->ball_y;
    double ball_bottom = ball_top + this->ball_size;
    double ball_left = this->ball_x;
    double ball_right = ball_left + this->ball_size;
    if (
        (ball_bottom > paddle_top && ball_bottom < paddle_bottom) //paddle y check
        && (
            (ball_left < paddle_right && ball_left > paddle_left) //x check with left side of ball
            || (ball_right < paddle_right && ball_right > paddle_left) //x check with right side of ball
        )
    ) {
        double prev_bottom = prev_y + this->ball_size;
        if (prev_bottom > paddle_top && ball_bottom < paddle_bottom) { //hit side of paddle
            double paddle_center = paddle_left + this->paddle_width/2.0;
            double offset = ball_left - paddle_center;
            if (offset < 0) { //hit left of paddle
                this->ball_x = paddle_left - this->ball_size;
            } else {
                this->ball_x = paddle_right;
            }

            this->ball_velocity_x *= -1;
        } else { //hit top
            this->ball_y = paddle_top - this->ball_size;
            this->ball_velocity_y *= -1;
            //increment score
            this->score += 1;
            //set score time
            this->score_time = this->last_timestamp;
        }
        twr_audio_play_volume(this->bounce_noise, BALL_BOUNCE_VOL, 0.0);
    }
}
void Pong::tickPaddle(long delta) {
    if (this->paddle_dir == PaddleDirection::LEFT) {
        this->paddle_x -= (double)delta * this->paddle_speed;
    } else if (this->paddle_dir == PaddleDirection::RIGHT) {
        this->paddle_x += (double)delta * this->paddle_speed;
    }
    if (this->paddle_x < this->border_width) {
        this->paddle_x = this->border_width;
    } else if (this->paddle_x > this->width - this->paddle_width - this->border_width) {
        this->paddle_x = this->width - this->paddle_width - this->border_width;
    }
}
void Pong::pressedLeft() {
    this->left_pressed = true;
    this->paddle_dir = PaddleDirection::LEFT;
}
void Pong::pressedRight() {
    this->right_pressed = true;
    this->paddle_dir = PaddleDirection::RIGHT;
}
void Pong::releasedLeft() {
    this->left_pressed = false;
    if (this->right_pressed) {
        this->paddle_dir = PaddleDirection::RIGHT;
    } else {
        this->paddle_dir = PaddleDirection::STATIONARY;
    }
}
void Pong::releasedRight() {
    this->right_pressed = false;
    if (this->left_pressed) {
        this->paddle_dir = PaddleDirection::LEFT;
    } else {
        this->paddle_dir = PaddleDirection::STATIONARY;
    }
}

void Pong::pressedEnter() {
    if (!this->game_running) {
        this->resetGame();
    }
}

void Pong::fillBorderedText(const char* text, double x, double y, double outer_width) {
    this->canvas.save();
    this->canvas.setLineWidth(outer_width);
    this->canvas.setStrokeStyleRGB(0xFFFFFF);
    this->canvas.strokeText(text, x, y);

    this->canvas.restore();
    this->canvas.fillText(text, x, y);
}
void Pong::strokeBorderedText(const char* text, double x, double y, double outer_width) {
    this->canvas.save();
    this->canvas.setLineWidth(outer_width);
    this->canvas.setStrokeStyleRGB(0xFFFFFF);
    this->canvas.strokeText(text, x, y);

    this->canvas.restore();
    this->canvas.strokeText(text, x, y);
}

enum class KeyCode {
   ArrowLeft = 8592,
   ArrowRight = 8594,
   a = 97,
   d = 100,
   enter = 10,
};

void Pong::keyDownEvent(long keycode) {
   switch ((KeyCode)keycode) {
         case KeyCode::ArrowLeft:
         case KeyCode::a:
            this->pressedLeft();
            break;
         
         case KeyCode::ArrowRight:
         case KeyCode::d:
            this->pressedRight();
            break;

         case KeyCode::enter:
            this->pressedEnter();
            break;
         
         default:
            //do nothing
            break;
      }
}
void Pong::keyUpEvent(long keycode) {
   switch ((KeyCode)keycode) {
      case KeyCode::ArrowLeft: 
      case KeyCode::a:
         this->releasedLeft();
         break;
      
      case KeyCode::ArrowRight:
      case KeyCode::d:
         this->releasedRight();
         break;
      
      default:
         //do nothing
         break;
   }
}
