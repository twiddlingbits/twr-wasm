#include <stdio.h>
#include <locale.h>

int main() {
    // Get the current locale for all categories
    char *locale = setlocale(LC_ALL, NULL);
    printf("Current locale: %s\n", locale);

    // Set the locale to the user's default environment settings
    setlocale(LC_ALL, "");
    // Get and print the new setting
    locale = setlocale(LC_ALL, NULL);
    printf("Locale after setting to default: %s\n", locale);

    return 0;
}