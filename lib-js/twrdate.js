// return ms since epoch as double
export function twrTimeEpochImpl() {
    return Date.now();
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
export function twrTimeTmLocalImpl(tmidx, epochSecs) {
    const d = new Date(epochSecs * 1000);
    this.setLong(tmidx, d.getSeconds());
    this.setLong(tmidx + 4, d.getMinutes());
    this.setLong(tmidx + 8, d.getHours());
    this.setLong(tmidx + 12, d.getDate());
    this.setLong(tmidx + 16, d.getMonth());
    this.setLong(tmidx + 20, d.getFullYear() - 1900);
    this.setLong(tmidx + 24, d.getDay());
    this.setLong(tmidx + 28, getDayOfYear(d));
    this.setLong(tmidx + 32, isDst());
    this.setLong(tmidx + 36, -d.getTimezoneOffset() * 60);
    this.setLong(tmidx + 40, noasyncPutString(this, getTZ(d)));
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
//# sourceMappingURL=twrdate.js.map