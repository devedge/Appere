
// Generate the required dimensions for the new window size
// Uses the image size, screen dimensions, and bounds
// Resizes the longest side, if needed, and scales the other
function genD(image_d, screen_d, bnds) {
    var new_width;
    var new_height;
    var scale_width;
    var scale_height;

    // image_d[0] = image width
    // image_d[1] = image height

    // screen_d[0] = screen width
    // screen_d[1] = screen height
    // screen_d[2] = screen 'x' center
    // screen_d[3] = screen 'y' center

    // bnds[0] = max_width
    // bnds[1] = max_height
    // bnds[2] = min_width
    // bnds[3] = min_height


    // If the width is greater than the max
    if (image_d[0] > bnds[0]) {

        // If the height is also greater than the max
        if (image_d[1] > bnds[1]) {

            // Ensure that the scaled side is still less than the bounds
            scale_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));
            scale_height = Math.floor(image_d[1] / (image_d[0] / bnds[0]));

            // The scaled width is larger than the max width bound
            if (scale_width > bnds[0]) {
                new_width = bnds[0];
                new_height = scale_height;

            } else if (scale_height > bnds[1]) {
                // The scaled height is larger than the max height bound
                new_width = scale_width;
                new_height = bnds[1];

            } else {
                // Neither are larger than their bounds, so pick the width as the
                // side to maximize
                new_width = bnds[0];
                new_height = scale_height;
            }
        } else {
            // Just the width is larger than the max
            new_width = bnds[0];
            new_height= Math.floor(image_d[1] / (image_d[0] / bnds[0]));
        }

    } else if (image_d[1] > bnds[1]) {
        // Since the first check failed, just the height is larger than the max
        new_height = bnds[1];
        new_width = Math.floor(image_d[0] / (image_d[1] / bnds[1]));

    } else {
        // Neither are larger than the max, so set them back to
        // their default values
        new_width = image_d[0];
        new_height = image_d[1];
    }

    // If any of the widths are smaller than the min, resize
    if (new_width < bnds[2]) {
        new_width = bnds[2];
    }

    // If any of the heights are smaller than the min, resize
    if (new_height < bnds[3]) {
        new_height = bnds[3];
    }

    // Return the calculated values
    // new image width
    // new image height
    // screen x center (width)
    // screen y center (height)
    return [
        new_width,
        new_height,
        Math.floor(screen_d[2] - (new_width / 2)),
        Math.floor(screen_d[3] - (new_height / 2))
    ];
}