#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <math.h>

#include "canvas.h"

enum class PaddleDirection {
    LEFT,
    STATIONARY,
    RIGHT
};
class Pong {
    public:
    Pong(double width, double height, colorRGB_t border_color, colorRGB_t background_color, colorRGB_t paddle_color, colorRGB_t ball_color);
    Pong();
    Pong& operator=(const Pong& copy);

    void render();
    void tick(long time);

    void pressedLeft();
    void releasedLeft();
    void pressedRight();
    void releasedRight();

    void pressedEnter();

    void keyDownEvent(long keycode);
    void keyUpEvent(long keycode);

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