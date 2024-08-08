#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

#include "canvas.h"

#define M_PI 3.14159265358979323846

enum class PaddleDirection {
    LEFT,
    STATIONARY,
    RIGHT
};
class Pong {
    public:
    Pong(double width, double height, colorRGB_t border_color, colorRGB_t background_color, colorRGB_t paddle_color, colorRGB_t ball_color);

    void render();
    void tick(long time);

    void pressedLeft();
    void releasedLeft();
    void pressedRight();
    void releasedRight();

    void pressedEnter();

    private:
    const double border_width = 10.0;
    const double paddle_offset = 50;
    const double paddle_height = 20;
    const double paddle_width = 75;
    const double ball_size = 20;

    #ifdef ASYNC
    const long background_image_id = 1;
    #endif

    const double score_green_time = 500;

    const double paddle_speed = 100/1000.0;
    
    double width;
    double height;
    colorRGB_t border_color;
    colorRGB_t background_color;
    colorRGB_t paddle_color;
    colorRGB_t ball_color;
    twrCanvas canvas;

    double ball_velocity_x;
    double ball_velocity_y;
    //all coordinates are from the top left corner
    double ball_x;
    double ball_y;
    double paddle_x;
    PaddleDirection paddle_dir = PaddleDirection::STATIONARY;
    //long last_paddle_press = 0;
    bool left_pressed = false;
    bool right_pressed = false;

    long last_timestamp = 0;
    long run_time = 0;
    int score = 0;
    long score_time = 0;
    bool game_running = true;

    void renderBackground();
    void renderBorder();
    void renderPaddle();
    void renderBall();
    void renderStats();

    void tickPaddle(long time);
    void tickBall(long time);

    void resetGame();
    void endGame();
    void renderEndGame();

    void fillBorderedText(const char* text, double x, double y, double outer_width);
    void strokeBorderedText(const char* text, double x, double y, double outer_width);
};
void Pong::endGame() {
    this->game_running = false;
}
void Pong::resetGame() {
    this->ball_x = this->width/2.0 - this->ball_size/2.0;
    this->ball_y = this->height/2.0 - this->ball_size/2.0;

    this->paddle_x = this->width/2.0 - this->paddle_width/2.0;

    const double start_speed = 200.0/1000.0;
    double start_dir = rand()%360;
    double start_dir_rad = start_dir * M_PI/180;

    this->ball_velocity_x = start_speed*cos(start_dir_rad);
    this->ball_velocity_y = start_speed*sin(start_dir_rad);
    this->game_running = true;
    this->run_time = 0;
    this->score = 0;
    this->last_timestamp = 0;
}
Pong::Pong(double width, double height, colorRGB_t border_color, colorRGB_t background_color, colorRGB_t paddle_color, colorRGB_t ball_color) {
    this->width = width;
    this->height = height;
    this->border_color = border_color;
    this->background_color = background_color;
    this->paddle_color = paddle_color;
    this->ball_color = ball_color;

    #ifdef ASYNC
    bool image_loaded = d2d_load_image("https://images.pexels.com/photos/235985/pexels-photo-235985.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1", background_image_id);
    assert(image_loaded);
    #endif
    //initialized random number generator
    srand(time(NULL));

    this->resetGame();
}
void Pong::render() {
    this->canvas.startDrawSequence();
    this->canvas.reset();
    this->canvas.setLineCap("round");
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
    this->canvas.drawImage(background_image_id, 0, 0);
    #endif

    //just used for testing getLineDash
    //not recommended for your main render loop
    unsigned long segment_len1 = this->canvas.getLineDashLength();
    double* buffer = NULL;
    if (segment_len1 > 0) {
        buffer = (double*)malloc(sizeof(double)*segment_len1);
    }
    double true_len = this->canvas.getLineDash(segment_len1, buffer);
    assert(true_len == segment_len1);

    this->canvas.beginPath();
    const long segment_len2 = 1;
    double segments[segment_len2] = {20};
    this->canvas.setLineDash(segment_len2, segments);
    this->canvas.setLineWidth(10.0);
    this->canvas.setStrokeStyleRGB(0xE0E0E0);
    this->canvas.moveTo(0.0, this->height);
    this->canvas.quadraticCurveTo(this->height/2.0, this->width - this->paddle_offset, this->width, this->height);
    this->canvas.stroke();

    this->canvas.setLineDash(segment_len1, buffer);
    if (buffer)
        free(buffer);

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

    this->canvas.setStrokeStyleRGB(this->border_color);
    this->canvas.beginPath();
    this->canvas.roundRect(offset, offset, this->width - this->border_width, this->height - this->border_width, 20.0);
    this->canvas.stroke();
}
void Pong::renderBall() {
    //start transform used to revert back to original state
    //mainly used for testing getTransform as it flushes the instruction buffer
    //  and may cause a drop in performance because of it
    d2d_2d_matrix start_transform;
    this->canvas.getTransform(&start_transform);

    // this->canvas.translate(this->ball_x, this->ball_y);
    this->canvas.transform(1.0, 0.0, 0.0, 1.0, this->ball_x, this->ball_y);

    this->canvas.setFillStyleRGB(this->ball_color);
    this->canvas.setLineWidth(2.0);
    this->canvas.beginPath();
    this->canvas.moveTo(this->ball_size/2.0, 0);
    this->canvas.lineTo(this->ball_size, this->ball_size);
    this->canvas.lineTo(0, this->ball_size);
    //this->canvas.lineTo(this->ball_x + this->ball_size/2.0, this->ball_y);
    this->canvas.closePath();
    this->canvas.fill();

    double mid_height_offset = this->ball_size/2.0;
    double slope = 2; //rises ball_width, runs 1/2 ball_width
    double mid_width_offset = (1/slope) * mid_height_offset;

    double angle = 45 * M_PI/180;
    this->canvas.translate(this->ball_size/2.0, this->ball_size/4.0 * 3);
    this->canvas.rotate(angle);

    this->canvas.clearRect(-mid_width_offset, -mid_height_offset/2.0, mid_width_offset*2.0, mid_height_offset);

    this->canvas.setTransform(&start_transform);
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
    this->canvas.setStrokeStyleRGB(0xededed);
    #else
    this->canvas.setStrokeStyleRGB(0x000000);
    #endif
    // this->canvas.setFillStyleRGB(0x000000);
    this->canvas.strokeText(text, 30.0, 30.0);
    // this->strokeBorderedText(text, 30.0, 30.0, 4.0);

    long minutes = (this->run_time/1000)/60;
    long seconds = (this->run_time/1000)%60;

    const int time_len = 14;
    char time[score_len] = {0};
    snprintf(time, time_len-1, "Time: %02ld:%02ld", minutes, seconds);
    this->canvas.strokeText(time, this->width - 150.0, 30.0);
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
    this->fillBorderedText(game, game_x, game_y, 4.0);

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
void Pong::tickBall(long delta) {
    double prev_y = this->ball_y;
    this->ball_x += this->ball_velocity_x * delta;
    this->ball_y += this->ball_velocity_y * delta;

    
    if (this->ball_x <= this->border_width) { //left wall
        this->ball_x = this->border_width;
        this->ball_velocity_x *= -1;
    } else if (this->ball_x >= this->width - this->ball_size - this->border_width) { //right wall
        this->ball_x = this->width - this->ball_size - this->border_width;
        this->ball_velocity_x *= -1;
    } 
    
    //x and y are seperate checks for the corner case
    if (this->ball_y <= border_width) { //top wall
        this->ball_y = this->border_width;
        this->ball_velocity_y *= -1;
    } else if (this->ball_y >= this->height - this->ball_size - this->border_width) { //bottom wall, lost game
        this->ball_y = this->height - this->ball_size - this->border_width - 1.0;
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
double width = 600.0;
double height = 600.0;

colorRGB_t border_color = 0x2b8fbd;
colorRGB_t background_color = 0xFFFFFF;
colorRGB_t paddle_color = 0xFF0000;
colorRGB_t ball_color = 0x00FF00;
Pong game(width, height, border_color, background_color, paddle_color, ball_color);
extern "C" void render() {
    game.render();
}
extern "C" void tick(long time) {
    game.tick(time);
}
enum class KeyCode {
    ArrowLeft = 37,
    ArrowRight = 39,
    Enter = 13
};
extern "C" void keyEvent(bool released, int key) {
    switch ((KeyCode)key) {
        case KeyCode::ArrowLeft:
        {
            if (released) {
                game.releasedLeft();
            } else {
                game.pressedLeft();
            }
        }
        break;
        
        case KeyCode::ArrowRight:
        {
            if (released) {
                game.releasedRight();
            } else {
                game.pressedRight();
            }
        }
        break;

        case KeyCode::Enter:
        {
            game.pressedEnter();
        }
        break;
    }
}