/**
 * 
 * @param r red value in number
 * @param g green value in number
 * @param b blue value in number
 * @returns hsl in {h, s, l} format, e.g. {h: 0, s: 0, l: 0}
 */
export function RGB_to_HSL(r, g, b) {
    // Make r, g, and b fractions of 1
    r /= 255;
    g /= 255;
    b /= 255;
  
    // Find greatest and smallest channel values
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
    if (delta == 0)
        h = 0;
      // Red is max
      else if (cmax == r)
        h = ((g - b) / delta) % 6;
      // Green is max
      else if (cmax == g)
        h = (b - r) / delta + 2;
      // Blue is max
      else
        h = (r - g) / delta + 4;
    
      h = Math.round(h * 60);
        
      // Make negative hues positive behind 360°
      if (h < 0)
          h += 360;
    l = (cmax + cmin) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    
    // Multiply l and s by 100
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return {h, s, l};
    // return "hsl(" + h + "," + s + "%," + l + "%)";
}

/**
 * 
 * @param h hue value in number
 * @param s saturation value in number 
 * @param l luminance value in number
 * @returns rgb in {r, g, b} format, e.g. {r: 0, g: 0, b: 0}
 */
export function HSL_to_RGB(h,s,l) {
    // Must be fractions of 1
    s /= 100;
    l /= 100;
  
    let c = (1 - Math.abs(2 * l - 1)) * s,
        x = c * (1 - Math.abs((h / 60) % 2 - 1)),
        m = l - c/2,
        r = 0,
        g = 0,
        b = 0;
    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;  
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return {r, g, b};
}
/**
 * 
 * @param h string of hex color, e.g. #f8f8f8
 */
export function HEX_to_RGB(h: string) {
    let r, g, b;

    // 3 digits
    if (h.length == 4) {
        r = "0x" + h[1] + h[1];
        g = "0x" + h[2] + h[2];
        b = "0x" + h[3] + h[3];

    // 6 digits
    } else if (h.length == 7) {
        r = "0x" + h[1] + h[2];
        g = "0x" + h[3] + h[4];
        b = "0x" + h[5] + h[6];
    }
    return {r, g, b}; 
}
export function string_rgb_to_number(rgb) {
    console.log({rgb})
    let sep = rgb.indexOf(",") > -1 ? "," : " ";
    rgb = rgb.substr(4).split(")")[0].split(sep);

    for (let R in rgb) {
        let r = rgb[R];
        if (r.indexOf("%") > -1) 
        rgb[R] = Math.round(r.substr(0,r.length - 1) / 100 * 255);
    }
    return {r: rgb[0], g: rgb[1], b: rgb[2]};
}

export function rgb_to_string(r, g, b) {
    return "rgb("+ +r + "," + +g + "," + +b + ")";
}

export function hsl_to_string(h, s, l) {
    return "hsl(" + h + "," + s + "%," + l + "%)";
}


/**
 * 
 * @param l luminance value in number
 * @returns constrast luminance value in number
 * @source: https://stackoverflow.com/questions/635022/calculating-contrasting-colours-in-javascript?rq=4
 */
export function contrast_luminance(l) {
    if(l > 1) l /= 100;
    if(l >= 0 && l <= 0.25) {
        return 0.75
    } else if(l > 0.25 && l < 0.5) {
        return 1
    } else if(l >= 0.5 && l < 0.75) {
        return 0
    } else if (l >= 0.75 && l <= 1) {
        return 0.25
    }
}