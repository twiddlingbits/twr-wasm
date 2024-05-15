// return ms since epoch as double
export function twrTimeEpochImpl() {
    return Date.now();
}
export function twrUserLanguageImpl() {
    return noasyncPutString(this, navigator.language);
}
//struct tm {
//	int	tm_sec;		/* seconds after the minute [0-60] */
//	int	tm_min;		/* minutes after the hour [0-59] */
//	int	tm_hour;		/* hours since midnight [0-23] */
//	int	tm_mday;		/* day of the month [1-31] */
//	int	tm_mon;		/* months since January [0-11] */
//	int	tm_year;		/* years since 1900 */
//	int	tm_wday;		/* days since Sunday [0-6] */
//	int	tm_yday;		/* days since January 1 [0-365] */
//	int	tm_isdst;	/* Daylight Saving Time flag */
//	long	tm_gmtoff;	/* offset from UTC in seconds */
//	char	*tm_zone;	/* timezone abbreviation */
//};
// fill in struct tm
// epcohSecs as 32bit int will overflow January 19, 2038. 
export function twrTimeTmLocalImpl(tmIdx, epochSecs) {
    const d = new Date(epochSecs * 1000);
    this.setLong(tmIdx, d.getSeconds());
    this.setLong(tmIdx + 4, d.getMinutes());
    this.setLong(tmIdx + 8, d.getHours());
    this.setLong(tmIdx + 12, d.getDate());
    this.setLong(tmIdx + 16, d.getMonth());
    this.setLong(tmIdx + 20, d.getFullYear() - 1900);
    this.setLong(tmIdx + 24, d.getDay());
    this.setLong(tmIdx + 28, getDayOfYear(d));
    this.setLong(tmIdx + 32, isDst());
    this.setLong(tmIdx + 36, -d.getTimezoneOffset() * 60);
    this.setLong(tmIdx + 40, noasyncPutString(this, getTZ(d)));
}
//struct lconv {
//	char	*decimal_point;
//	char	*thousands_sep;
//	char	*grouping;
//	char	*int_curr_symbol;
//	char	*currency_symbol;
//	char	*mon_decimal_point;
//	char	*mon_thousands_sep;
//	char	*mon_grouping;
//	char	*positive_sign;
//	char	*negative_sign;
//	char	int_frac_digits;
//	char	frac_digits;
//	char	p_cs_precedes;
//	char	p_sep_by_space;
//	char	n_cs_precedes;
//	char	n_sep_by_space;
//	char	p_sign_posn;
//	char	n_sign_posn;
//};
export function twrUserLconvImpl(lconvIdx) {
    const locDec = getLocaleDecimalPoint();
    const locSep = getLocaleThousandsSeparator();
    setAndPutString(this, lconvIdx + 0, locDec);
    setAndPutString(this, lconvIdx + 4, locSep);
    setAndPutString(this, lconvIdx + 20, locDec);
    setAndPutString(this, lconvIdx + 24, locSep);
}
function setAndPutString(mod, idx, sin) {
    const stridx = noasyncPutString(mod, sin);
    mod.setLong(idx, stridx);
}
// allocate and copy a string into the webassembly module memory
function noasyncPutString(mod, sin) {
    const malloc = mod.exports.malloc;
    const strIndex = malloc(sin.length + 1);
    mod.copyString(strIndex, sin.length + 1, sin);
    return strIndex;
}
function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    const diff = date.getTime() - start.getTime(); // Difference in milliseconds
    const oneDay = 1000 * 60 * 60 * 24; // Number of milliseconds in one day
    const day = Math.floor(diff / oneDay);
    return day;
}
function isDst() {
    const timeString = new Date().toLocaleTimeString('en-US', { timeZoneName: 'long' });
    if (timeString.includes('Daylight')) {
        return 1;
    }
    else {
        return 0;
    }
}
function getTZ(date) {
    const timeZone = date.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
    return timeZone ? timeZone : "UTC";
}
function getLocaleDecimalPoint() {
    const formatter = new Intl.NumberFormat();
    //console.log("dec resolvedOptions", formatter.resolvedOptions());
    // Format a test number to find out the decimal point.
    const formattedNumber = formatter.format(1.1);
    //console.log("dec formattedNumber", formattedNumber);
    // Find the character between the numeric parts.
    const decimalPoint = formattedNumber.replace(/[0-9]/g, '').charAt(0);
    return decimalPoint;
}
function getLocaleThousandsSeparator() {
    const formatter = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0 // Ensure no decimal part interferes
    });
    // Format a test number to include a thousands separator.
    const formattedNumber = formatter.format(1000);
    //console.log("sep formattedNumber", formattedNumber);
    // Extract the thousands separator by removing numeric characters and possible decimal points.
    // This may need adjustment depending on whether other characters are present.
    let thousandsSeparator = formattedNumber.replace(/[0-9]/g, '').charAt(0); // Assumes separator is the first character.
    if (thousandsSeparator.charCodeAt(0) == 8239)
        thousandsSeparator = ' '; // turn narrow-no-break-space into space, until i support unicode
    //console.log("sep code",  thousandsSeparator.charCodeAt(0));
    return thousandsSeparator;
}
// this doesn't work, localeCurrency is not correct
function getLocaleCurrencyDecimalPoint() {
    // Create an initial NumberFormat object to detect the locale's currency
    const tempFormatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
    const localeCurrency = tempFormatter.resolvedOptions().currency;
    const formatter = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: localeCurrency
    });
    // Format a test number to find out the decimal point.
    const formattedNumber = formatter.format(1.1);
    // Find the character between the numeric parts.
    // char(0) is the currency symbol
    const decimalPoint = formattedNumber.replace(/[0-9]/g, '').charAt(1);
    return decimalPoint;
}
//# sourceMappingURL=twrdate.js.map