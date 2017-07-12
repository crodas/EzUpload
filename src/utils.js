/**
 * Converts an array to an URL
 */
export function build_http_query(obj) {
    var str = "";
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (str != "") {
                str += "&";
            }
            str += key + "=" + encodeURIComponent(obj[key]);
        }
    }
    return str;
}
